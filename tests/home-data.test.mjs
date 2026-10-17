import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndicators, buildSources, sourceObservations, ids } from '../scripts/build_home_data.mjs';
import { validateSnapshot, valueLabel, periodLabel, fetchSnapshot } from '../assets/home-data.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const raw=json('../assets/data/indicadores-clave/ove_indicadores_clave_venezuela.json');
const catalogs=Object.fromEntries(['bcv','world-bank','imf','ilo','fred','ine','cepal','unctad'].map(id=>[id,json(`../assets/data/${id}/catalog/${id}-catalog.json`)]));
const payload=()=>({schema_version:1,version:'test',indicators:buildIndicators(raw),sources:buildSources(catalogs)});
test('all six latest values and dates derive from sorted valid observations',()=>{
 const indicators=buildIndicators({...raw,observations:[...raw.observations].reverse()});
 for(const [key,id] of Object.entries(ids)){
  const rows=raw.observations.filter(r=>r.indicator_id===id && typeof r.value==='number').sort((a,b)=>a.date.localeCompare(b.date));
  assert.equal(indicators[key].latest.value,rows.at(-1).value);assert.equal(indicators[key].latest.date,rows.at(-1).date);
 }
});
test('new database observation changes home value, period, chart and CSV points',()=>{
 const changed=structuredClone(raw);
 const row=structuredClone(changed.observations.find(r=>r.indicator_id===ids.cambio));
 Object.assign(row,{date:'2099-12-31',period:'2099-12-31',value:1234.5678});changed.observations.unshift(row);
 const s=buildIndicators(changed).cambio;
 assert.equal(s.latest.value,1234.5678);assert.equal(s.latest.date,'2099-12-31');assert.deepEqual(s.points.at(-1),['2099-12-31',1234.5678]);
});
test('missing series, empty and duplicate data fail rather than publish fabricated fallback',()=>{
 assert.throws(()=>buildIndicators({observations:[]}));
 assert.throws(()=>buildIndicators({...raw,observations:[...raw.observations,raw.observations[0]]}));
});
test('invalid and null values never become zero or supersede valid latest value',()=>{
 const changed=structuredClone(raw); const row=structuredClone(changed.observations.find(r=>r.indicator_id===ids.pib));
 changed.observations.push({...row,date:'2099-01-01',value:null},{...row,date:'2098-01-01',value:'999'});
 assert.deepEqual(buildIndicators(changed).pib,buildIndicators(raw).pib);
});
test('all eight counters derive from catalogs with precise definitions',()=>{
 const s=buildSources(catalogs);assert.equal(Object.keys(s).length,8);
 assert.equal(s['world-bank'].value,catalogs['world-bank'].metadatos['Número de registros']);
 assert.equal(s.ilo.value,catalogs.ilo.metadatos['Número de registros']);
 assert.equal(s.fred.value,catalogs.fred.metadatos['Número de series catalogadas']);
 assert.equal(s.bcv.value,catalogs.bcv.last_fetched_at);
 const changed=structuredClone(catalogs);changed.ilo.metadatos['Número de registros']+=10;
 assert.equal(buildSources(changed).ilo.value,s.ilo.value+10);
});
test('Spanish display, no scaling applied twice, and source periods preserved',()=>{
 const s=buildIndicators(raw);
 assert.match(valueLabel(s.cambio),/,/);assert.equal(periodLabel(s.pib),String(s.pib.latest.period));
 assert.match(periodLabel(s.inpc),/202\d/);
 assert.equal(s.pib_corriente.latest.value,raw.observations.filter(r=>r.indicator_id===ids.pib_corriente).at(-1).value);
});
test('schema validation rejects empty, malformed and inconsistent snapshots',()=>{
 assert.doesNotThrow(()=>validateSnapshot(payload()));
 for(const key of Object.keys(ids)) {const p=payload();p.indicators[key].points=[];assert.throws(()=>validateSnapshot(p));}
 const p=payload();p.indicators.pib.latest.value=NaN;assert.throws(()=>validateSnapshot(p));
});
test('fetch bypasses browser cache and rejects failures, not empty replacement data',async()=>{
 let seen;
 const result=await fetchSnapshot(async(url,options)=>{seen={url,options};return {ok:true,json:async()=>payload()};});
 assert.equal(seen.url,'/assets/data/home/ove_home.json');assert.equal(seen.options.cache,'no-store');assert.equal(result.version,'test');
 await assert.rejects(fetchSnapshot(async()=>({ok:false,status:503})));
});
test('home no longer embeds old statistical values or chart histories',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const old of ['721,35','1.088.839','5.216','11 jul 2026','points:[[2018']) assert.ok(!html.includes(old),old);
 assert.equal((html.match(/data-home-ticker="/g)||[]).length,8);
 assert.equal((html.match(/<strong data-home-source="/g)||[]).length,8);
});

test('home reads underlying databases and matches consolidated indicators today',()=>{
 const read=p=>json('../'+p);
 assert.deepEqual(buildIndicators(sourceObservations(read)),buildIndicators(raw));
});
test('a direct BCV update is reflected without needing a consolidated rebuild',()=>{
 const read=p=>{
   const d=json('../'+p);
   if(p.endsWith('ove_bcv_tipo_cambio_usd.json')) d.observations.push({...d.observations.at(-1),date:'2099-12-31',value:999.99});
   return d;
 };
 assert.equal(buildIndicators(sourceObservations(read)).cambio.latest.value,999.99);
});

#!/usr/bin/env node
// Offline derivation: no API calls, guessed figures, or extra dependencies.
import { readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

export const ids = {
  pib: 'pib_real_bcv', inpc: 'inpc_nacional_bcv', cambio: 'tipo_cambio_bcv_usd',
  desempleo: 'desempleo_total_wdi', pib_corriente: 'pib_corriente_wdi', pib_per_capita: 'pib_per_capita_wdi'
};
export function buildIndicators(data) {
  return Object.fromEntries(Object.entries(ids).map(([key, id]) => {
    const rows = (data.observations || []).filter(r => r.indicator_id === id && typeof r.value === 'number' && Number.isFinite(r.value) && /^\d{4}-\d{2}-\d{2}$/.test(r.date || ''))
      .sort((a,b) => a.date.localeCompare(b.date));
    if (!rows.length) throw new Error(`No valid observations: ${id}`);
    const latest = rows.at(-1);
    if (new Set(rows.map(r=>r.date)).size !== rows.length) throw new Error(`Duplicate periods: ${id}`);
    return [key, { id, title: latest.indicator, source: latest.source, source_url: latest.source_url,
      frequency: latest.frequency, unit: latest.unit, latest: { value: latest.value, date: latest.date, period: latest.period },
      points: rows.map(r => [r.period, r.value]) }];
  }));
}
export function buildSources(catalogs) {
  return Object.fromEntries(Object.entries(catalogs).map(([id, data]) => {
    const meta = data.metadatos || {};
    let value, label;
    if (id === 'bcv') { value = data.last_fetched_at; label = 'última captura'; }
    else if (id === 'imf') {
      const starts = data.catalogo.map(r=>Number(String(r['Primer periodo']).slice(0,4))).filter(Number.isFinite);
      const ends = data.catalogo.map(r=>Number(String(r['Último periodo']).slice(0,4))).filter(Number.isFinite);
      if (!starts.length || !ends.length) throw new Error('Missing IMF coverage');
      value = `${Math.min(...starts)}–${Math.max(...ends)}`; label = 'cobertura variable';
    } else if (id === 'fred') { value = meta['Número de series catalogadas']; label = 'series catalogadas'; }
    else if (id === 'ine') { value = meta['Número de recursos']; label = 'recursos catalogados'; }
    else if (id === 'unctad') { value = meta['Número de valores extraídos']; label = 'valores extraídos'; }
    else { value = meta['Número de registros']; label = 'registros'; }
    if (value == null || value === '' || (typeof value === 'number' && (!Number.isFinite(value) || value < 0))) throw new Error(`Invalid catalog: ${id}`);
    return [id, { value, label, captured_at: data.last_fetched_at || meta['Fecha generación'] || null,
      catalog: `/assets/data/${id}/catalog/${id}-catalog.json` }];
  }));
}
// Read the actual normalized databases, not an independently stale home copy.
export function sourceObservations(read) {
  const observations=[];
  const addBcv=(file,key,title,frequency,unit,valueOf,dateOf,periodOf)=>{
    const data=read(`assets/data/bcv/json/${file}.json`);
    for(const r of data.observations || []) observations.push({indicator_id:ids[key],indicator:title,
      source:'Banco Central de Venezuela',source_url:r.source_url||data.metadata.source_url,
      frequency,unit,value:valueOf(r),date:dateOf(r),period:periodOf(r)});
  };
  addBcv('ove_bcv_pib_real_anual','pib','PIB real','Anual','% anual',r=>r.annual_real_gdp_growth_pct,r=>`${r.year}-01-01`,r=>String(r.year));
  addBcv('ove_bcv_inpc_nacional_mensual','inpc','INPC nacional','Mensual','% mensual',r=>r.monthly_variation_pct,r=>r.date,r=>r.date.slice(0,7));
  addBcv('ove_bcv_tipo_cambio_usd','cambio','Tipo de cambio BCV','Diaria','Bs/USD',r=>r.value,r=>r.date,r=>r.date);
  for(const [key,code,file,title,unit,scale] of [
    ['pib_corriente','NY.GDP.MKTP.CD','macroeconomia','PIB corriente','US$ mil millones',1e9],
    ['pib_per_capita','NY.GDP.PCAP.CD','macroeconomia','PIB per cápita','US$',1],
    ['desempleo','SL.UEM.TOTL.ZS','mercado_laboral','Desempleo total','% fuerza laboral',1]
  ]) {
    const data=read(`assets/data/world-bank/json/ove_banco_mundial_venezuela_${file}.json`);
    for(const r of data.datos || []) if(r['Código indicador']===code) observations.push({
      indicator_id:ids[key],indicator:title,source:'Banco Mundial - World Development Indicators',
      source_url:`https://api.worldbank.org/v2/country/VEN/indicator/${code}?format=json&per_page=100`,
      frequency:'Anual',unit,value:typeof r.Valor==='number'?r.Valor/scale:null,
      date:`${r['Año']}-01-01`,period:String(r['Año'])
    });
  }
  return {observations};
}
export function main(root = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  const read = p => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
  const keyData = read('assets/data/indicadores-clave/ove_indicadores_clave_venezuela.json');
  const catalogs = Object.fromEntries(['bcv','world-bank','imf','ilo','fred','ine','cepal','unctad'].map(id => [id, read(`assets/data/${id}/catalog/${id}-catalog.json`)]));
  const indicators = buildIndicators(sourceObservations(read));
  // Optional BCV announced-INPC note: present only while the homepage announcement
  // is newer than the official statistical series. Absence changes nothing.
  try {
    const note = read('assets/data/bcv/json/ove_bcv_inpc_dato_anunciado.json');
    if (note?.mostrar_nota && note?.anunciado && indicators.inpc) {
      indicators.inpc = { ...indicators.inpc, anunciado: {
        period: note.anunciado.period,
        period_label: note.anunciado.period_label,
        var_mensual_pct: note.anunciado.var_mensual_pct,
        var_acumulada_pct: note.anunciado.var_acumulada_pct,
        status: note.metadata?.status || null,
        disclaimer: note.metadata?.disclaimer || null,
        checked_at: note.metadata?.last_fetched_at || null,
        source_url: note.metadata?.source_url || null
      }};
    }
  } catch { /* no note available: home stays statistical-only */ }
  const payload = { schema_version: 1, dataset_generated_at: keyData.metadata.generated_at,
    indicators, sources: buildSources(catalogs) };
  payload.version = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,16);
  const target = resolve(root, 'assets/data/home/ove_home.json');
  const text = JSON.stringify(payload, null, 2) + '\n';
  mkdirSync(dirname(target), { recursive: true });
  // Atomic write; validation failures never replace a working snapshot.
  writeFileSync(target + '.tmp', text); renameSync(target + '.tmp', target);
  console.log(`Home snapshot ${payload.version}: ${Object.keys(payload.indicators).length} indicators, ${Object.keys(payload.sources).length} sources`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

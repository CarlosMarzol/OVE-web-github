import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('one H1 and descriptive title and meta description',()=>{
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 const title=html.match(/<title>(.*?)<\/title>/s)[1];assert.match(title,/Economía de Venezuela/);assert.match(title,/OVE/);
 const desc=html.match(/<meta name="description" content="([^"]+)"/)[1];assert.match(desc,/PIB/);assert.match(desc,/inflación/);assert.ok(desc.length<180);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.ok(html.includes('href="https://ove-venezuela.com/"'));
 assert.ok(!/noindex/.test(html));
});
test('structured data is valid and makes no unsupported publication claims',()=>{
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(data['@context'],'https://schema.org');assert.deepEqual(data['@graph'].map(x=>x['@type']),['Organization','WebSite','WebPage']);
 for(const item of data['@graph']) assert.ok(item['@id'].startsWith('https://ove-venezuela.com/'));
 assert.equal(data['@graph'][0].name,'Observatorio Venezolano de Economía');
});
test('social titles and descriptions match the search page description',()=>{
 const title=html.match(/<title>(.*?)<\/title>/s)[1];
 for(const name of ['og:title','twitter:title'])assert.ok(html.includes(`content="${title}"`));
 assert.match(html,/og:locale" content="es_VE/);
});
test('generic slogans removed; preparation status and working data selectors preserved',()=>{
 for(const old of ['Del dato aislado a una lectura útil','La confianza también se diseña','La próxima lectura','una economía que merece contexto','Publicaciones recientes del observatorio']) assert.ok(!html.includes(old),old);
 assert.match(html,/En preparación/);assert.match(html,/aún no está disponible para descarga/);
 for(const selector of ['data-home-data-status','data-home-ticker','data-home-source','data-home-featured-value','data-download-series'])assert.ok(html.includes(selector));
});

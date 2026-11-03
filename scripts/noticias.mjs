// Robot de noticias de Mi IVA Cuenta (Vibras Positivas HM)
// Busca en Google Noticias lo último sobre la devolución del IVA / EfectIVA y lo guarda en noticias.json
import { writeFile, readFile } from 'node:fs/promises';

const BUSQUEDAS = [
  'EfectIVA',
  '"devolución del IVA" Colombia',
  '"Ley de Rescate" IVA',
  'devolución IVA factura electrónica cédula',
  'Prosperidad Social devolución del IVA'
];

const limpiar = s => (s || '')
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? limpiar(m[1]) : ''; };

async function buscar(q) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:30d')}&hl=es-419&gl=CO&ceid=CO:es-419`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 MiIvaCuentaBot' } });
  if (!r.ok) throw new Error(`${q}: HTTP ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1];
    let titulo = tag(it, 'title');
    const fuente = tag(it, 'source');
    if (fuente && titulo.endsWith(' - ' + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    return { titulo, url: tag(it, 'link'), fuente, fecha: new Date(tag(it, 'pubDate')).toISOString() };
  });
}

let previas = [];
try { previas = JSON.parse(await readFile('noticias.json', 'utf8')).noticias || []; } catch {}

const todas = [...previas];
for (const q of BUSQUEDAS) {
  try { todas.push(...await buscar(q)); } catch (e) { console.error('Falló', e.message); }
}

const vistas = new Set();
const relevante = /iva|efectiva|rescate|prosperidad|factura/i;
const noticias = todas
  .filter(n => n.titulo && n.url && relevante.test(n.titulo))
  .filter(n => { const k = n.titulo.toLowerCase().replace(/\W+/g, ' ').slice(0, 80); if (vistas.has(k)) return false; vistas.add(k); return true; })
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  .slice(0, 40);

await writeFile('noticias.json', JSON.stringify({ actualizado: new Date().toISOString(), noticias }, null, 1));
console.log(`noticias.json con ${noticias.length} noticias`);

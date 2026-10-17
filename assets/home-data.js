// Formatting and validation shared by home and its automated tests.
export function periodLabel(series) {
  const { date, period } = series.latest;
  if (series.frequency === 'Anual') return String(period);
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat('es-VE', series.frequency === 'Mensual'
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}
export function valueLabel(series) {
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 0,
    maximumFractionDigits: series.id === 'pib_corriente_wdi' || series.id === 'pib_per_capita_wdi' ? 1 : 2 }).format(series.latest.value);
}
export function validateSnapshot(data) {
  if (data?.schema_version !== 1 || !data.version) throw new Error('Invalid home schema');
  for (const key of ['pib','inpc','cambio','desempleo','pib_corriente','pib_per_capita']) {
    const s = data.indicators?.[key];
    if (!s || !Number.isFinite(s.latest?.value) || !s.latest.date || !Array.isArray(s.points) || !s.points.length ||
      s.points.some(p=>!Array.isArray(p) || !Number.isFinite(p[1])) || s.points.at(-1)[1] !== s.latest.value) throw new Error(`Invalid series: ${key}`);
  }
  if (!data.sources || Object.keys(data.sources).length !== 8) throw new Error('Invalid home sources');
  return data;
}
export async function fetchSnapshot(fetcher = fetch) {
  const response = await fetcher('/assets/data/home/ove_home.json', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Home data HTTP ${response.status}`);
  return validateSnapshot(await response.json());
}

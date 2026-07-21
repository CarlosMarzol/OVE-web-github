import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "assets/data/inventario-indicadores/inventario_indicadores_ove_web.json");

const SOURCE_FILES = {
  "Banco Mundial - WDI": { pathFromRecord: true, codeField: "Código indicador", delimiter: ";" },
  "FMI - World Economic Outlook": { path: "assets/data/imf/csv/ove_fmi_weo_venezuela.csv", codeField: "Código indicador", delimiter: ";" },
  "CEPALSTAT - CEPAL": { path: "assets/data/cepal/csv/ove_cepalstat_venezuela_valores.csv.gz", codeField: "ID indicador CEPALSTAT", delimiter: ";" },
  "UNCTADstat - UNCTAD": { path: "assets/data/unctad/csv/ove_unctadstat_venezuela_valores.csv.gz", codeField: "Reporte UNCTAD", delimiter: ";" },
  "FRED - Federal Reserve Bank of St. Louis": { path: "assets/data/fred/csv/ove_fred_venezuela.csv", codeField: "ID serie FRED", delimiter: ";" },
  "OVE - Indicadores clave": { path: "assets/data/indicadores-clave/ove_indicadores_clave_venezuela.csv", codeField: "indicator_id", delimiter: "," }
};

const ILO_FREQUENCY_FILES = {
  "Anual": "assets/data/ilo/csv/ove_oit_ilostat_venezuela_anual.csv.gz",
  "Trimestral": "assets/data/ilo/csv/ove_oit_ilostat_venezuela_trimestral.csv.gz",
  "Mensual": "assets/data/ilo/csv/ove_oit_ilostat_venezuela_mensual.csv.gz"
};

const BCV_VALUE_COLUMNS = {
  bcv_pib_real_anual: "annual_real_gdp_growth_pct",
  bcv_inpc_indice: "index_value",
  bcv_inpc_variacion_mensual: "monthly_variation_pct"
};

function clean(value) {
  return String(value ?? "").trim();
}

function escapeXml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filenamePart(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "indicador";
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter(items => items.some(item => clean(item)))
    .map(items => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ""])));
}

function readRows(assetPath, delimiter) {
  const fullPath = path.join(ROOT, assetPath);
  const buffer = fs.readFileSync(fullPath);
  const text = assetPath.endsWith(".gz") ? zlib.gunzipSync(buffer).toString("utf8") : buffer.toString("utf8");
  return parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
}

function hasValue(row) {
  return ["Valor", "value", "obs_value", "annual_real_gdp_growth_pct", "index_value", "monthly_variation_pct"]
    .some(key => clean(row[key]) !== "");
}

function standardRows(record) {
  const config = SOURCE_FILES[record.fuente];
  if (!config) return [];
  const assetPath = config.pathFromRecord ? record.archivo_origen : config.path;
  if (!assetPath) return [];
  return readRows(assetPath, config.delimiter)
    .filter(row => clean(row[config.codeField]) === clean(record.codigo) && hasValue(row));
}

function bcvRows(record) {
  if (!record.archivo_origen) return [];
  const rows = readRows(record.archivo_origen, ",");
  const code = clean(record.codigo);
  const valueColumn = BCV_VALUE_COLUMNS[code];

  if (valueColumn) {
    return rows
      .filter(row => clean(row[valueColumn]) !== "")
      .map(row => ({
        indicator_id: code,
        indicator_name: record.indicador,
        year: row.year || "",
        date: row.date || "",
        value: row[valueColumn],
        unit: row.unit || "",
        frequency: row.frequency || record.frecuencia || "",
        source: row.source || record.fuente,
        source_url: row.source_url || "",
        fetched_at: row.fetched_at || ""
      }));
  }

  if (rows.some(row => Object.prototype.hasOwnProperty.call(row, "indicator_id"))) {
    return rows.filter(row => clean(row.indicator_id) === code && hasValue(row));
  }
  return rows.filter(hasValue);
}

function iloRows(record) {
  const assetPath = ILO_FREQUENCY_FILES[record.frecuencia];
  if (!assetPath) return [];
  return readRows(assetPath, ",")
    .filter(row => clean(row.indicator) === clean(record.codigo) && hasValue(row));
}

function ineRows(record) {
  const rows = readRows("assets/data/ine/csv/ove_ine_venezuela_celdas_tabulares.csv.gz", ";");
  const code = clean(record.codigo);
  const title = clean(record.indicador_original || record.indicador);
  return rows.filter(row =>
    (clean(row["ID recurso"]) === code || clean(row["Título"]) === title) &&
    clean(row["Valor"]) !== ""
  );
}

function rowsFor(record) {
  if (record.fuente === "Banco Central de Venezuela") return bcvRows(record);
  if (record.fuente === "OIT - ILOSTAT") return iloRows(record);
  if (record.fuente === "INE Venezuela") return ineRows(record);
  return standardRows(record);
}

function workbookHtml(record, rows) {
  const fields = Object.keys(rows[0] || {});
  const meta = [
    ["Tema OVE", record.tema],
    ["Subárea OVE", record.subarea],
    ["Indicador", record.indicador],
    ["Fuente", record.fuente],
    ["Código", record.codigo],
    ["Frecuencia", record.frecuencia],
    ["Primer periodo", record.primer_periodo],
    ["Último periodo", record.ultimo_periodo],
    ["Registros incluidos", rows.length],
    ["Archivo origen normalizado", record.archivo_origen]
  ];

  const metaRows = meta.map(([key, value]) => `<tr><th>${escapeXml(key)}</th><td>${escapeXml(value)}</td></tr>`).join("");
  const header = fields.map(field => `<th>${escapeXml(field)}</th>`).join("");
  const dataRows = rows.map(row => `<tr>${fields.map(field => `<td>${escapeXml(row[field])}</td>`).join("")}</tr>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #0A2D5A; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; color: #6B6B6B; margin: 0 0 18px; }
    table { border-collapse: collapse; margin-bottom: 22px; }
    th { background: #0A2D5A; color: #FFFFFF; font-weight: 700; }
    th, td { border: 1px solid #D9E2EF; padding: 6px 8px; vertical-align: top; }
    .brand { color: #0A2D5A; font-weight: 700; }
  </style>
</head>
<body>
  <p class="brand">Observatorio Venezolano de Economía</p>
  <h1>${escapeXml(record.indicador)}</h1>
  <h2>${escapeXml(record.fuente)}</h2>
  <table>${metaRows}</table>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
</body>
</html>`;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const id = clean(request.query?.id);
  if (!id) return response.status(400).json({ ok: false, error: "MISSING_ID" });

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
  const record = (inventory.records || []).find(item => item.download_id === id);
  if (!record) return response.status(404).json({ ok: false, error: "INDICATOR_NOT_FOUND" });

  const rows = rowsFor(record);
  if (!rows.length) return response.status(404).json({ ok: false, error: "NO_NORMALIZED_DATA" });

  const filename = [
    "ove",
    filenamePart(record.tema),
    filenamePart(record.subarea),
    filenamePart(record.fuente),
    filenamePart(record.codigo || record.indicador)
  ].join("_");

  response.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="${filename}.xls"`);
  response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return response.status(200).send(workbookHtml(record, rows));
}

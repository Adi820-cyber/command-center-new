import {
  formulaMeasureKeys,
  type SaasWorkspace,
} from "@orbit/contracts";

/**
 * CSV intake, end to end, without touching the network.
 *
 * The file is one row per unit and period, one column per measure:
 *
 *   unit,period_start,period_end,revenue,tests_performed
 *   Mumbai Lab,2026-09-01,2026-09-30,4200000,18400
 *
 * That is the format a finance or operations team can fill from a spreadsheet.
 * Everything is checked here first, so a person sees every problem with their
 * file at once, before anything is submitted.
 */

export const MAX_ROWS = 1000;
export const MAX_MEASURES_PER_ROW = 500;
export const FIXED_COLUMNS = ["unit", "period_start", "period_end"] as const;

type Measure = SaasWorkspace["measures"][number];
type Kpi = SaasWorkspace["kpis"][number];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** RFC 4180 style: quoted fields, doubled quotes, CRLF, a leading byte-order mark. */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const sep = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

/** Excel in many locales saves with semicolons or tabs. */
function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (d: string) => header.split(d).length - 1;
  const [best] = [",", ";", "\t"].map((d) => [d, count(d)] as const).sort((a, b) => b[1] - a[1])[0]!;
  return best;
}

/** CSV text for a row of cells. */
export const toCsv = (rows: readonly (readonly string[])[]): string =>
  rows
    .map((row) =>
      row.map((cell) => (/[",\n\r]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell)).join(","),
    )
    .join("\r\n") + "\r\n";

// ---------------------------------------------------------------------------
// Dates and numbers, as people really type them
// ---------------------------------------------------------------------------

/** `2026-09-01`, `01/09/2026` and `1-9-2026` (day first) all become `2026-09-01`. */
export function normalizeDate(raw: string): string | null {
  const text = raw.trim();
  let year: number, month: number, day: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number];
  else {
    match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
    if (!match) return null;
    [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number];
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A plain decimal the API accepts, or a reason it is not. */
export function normalizeNumber(raw: string): { value: string } | { error: string } {
  let text = raw.trim();
  // Western (1,234,567) and Indian (12,34,567) digit grouping; the last group is always three digits.
  if (/^-?\d{1,3}(,\d{2,3})*,\d{3}(\.\d+)?$/.test(text)) text = text.replaceAll(",", "");
  if (text.endsWith("%")) return { error: "remove the % sign and enter the plain number" };
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { error: `"${raw.trim()}" is not a number` };
  const [whole = "", fraction = ""] = text.replace(/^-/, "").split(".");
  if (fraction.length > 10) return { error: "use at most 10 decimal places" };
  if (whole.replace(/^0+(?=\d)/, "").length > 20) return { error: "the number is too large" };
  const normalized = `${text.startsWith("-") ? "-" : ""}${whole.replace(/^0+(?=\d)/, "")}${fraction ? `.${fraction}` : ""}`;
  return { value: normalized === "-0" ? "0" : normalized };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface CsvRow {
  /** Line number in the file, counting the header as 1. */
  line: number;
  unitName: string;
  unitId: string | null;
  start: string | null;
  end: string | null;
  values: { measure: string; value: string }[];
  errors: string[];
}
export interface CsvReport {
  /** Problems with the file as a whole. */
  fileErrors: string[];
  rows: CsvRow[];
  /** Rows with no errors, ready to submit. */
  ready: CsvRow[];
}

const clean = (text: string) => text.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** Checks a parsed file against the organisation's units and measures. */
export function validateCsv(table: string[][], workspace: SaasWorkspace): CsvReport {
  const fileErrors: string[] = [];
  const [header, ...body] = table;
  if (!header) return { fileErrors: ["The file is empty."], rows: [], ready: [] };

  const columns = header.map(clean);
  for (const fixed of FIXED_COLUMNS)
    if (!columns.includes(fixed)) fileErrors.push(`The header must contain a "${fixed}" column.`);
  const measureKeys = new Set(workspace.measures.map((m) => m.key));
  const measureColumns = columns
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => !(FIXED_COLUMNS as readonly string[]).includes(name) && name !== "");
  const unknown = measureColumns.filter(({ name }) => !measureKeys.has(name)).map(({ name }) => name);
  if (unknown.length)
    fileErrors.push(`Unknown measure column${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}. Download the format to see valid names.`);
  const duplicates = columns.filter((name, i) => name !== "" && columns.indexOf(name) !== i);
  if (duplicates.length) fileErrors.push(`Column repeated: ${[...new Set(duplicates)].join(", ")}.`);
  if (body.length === 0) fileErrors.push("The file has a header but no rows.");
  if (body.length > MAX_ROWS) fileErrors.push(`The file has ${body.length} rows; the limit is ${MAX_ROWS}. Split it into smaller files.`);
  if (fileErrors.length) return { fileErrors, rows: [], ready: [] };

  const at = (name: string) => columns.indexOf(name);
  const units = new Map<string, string>();
  for (const unit of workspace.units) {
    units.set(unit.name.trim().toLowerCase(), unit.id);
    units.set(unit.id.toLowerCase(), unit.id);
  }
  const seen = new Set<string>();
  const rows: CsvRow[] = body.map((cells, i) => {
    const row: CsvRow = { line: i + 2, unitName: (cells[at("unit")] ?? "").trim(), unitId: null, start: null, end: null, values: [], errors: [] };
    row.unitId = units.get(row.unitName.toLowerCase()) ?? null;
    if (!row.unitName) row.errors.push("unit is empty");
    else if (!row.unitId) row.errors.push(`unit "${row.unitName}" is not in this organization`);
    const start = normalizeDate(cells[at("period_start")] ?? "");
    const end = normalizeDate(cells[at("period_end")] ?? "");
    if (!start) row.errors.push(`period_start "${(cells[at("period_start")] ?? "").trim()}" is not a date (use 2026-09-01 or 01/09/2026)`);
    if (!end) row.errors.push(`period_end "${(cells[at("period_end")] ?? "").trim()}" is not a date (use 2026-09-30 or 30/09/2026)`);
    if (start && end && end < start) row.errors.push("period_end is before period_start");
    row.start = start;
    row.end = end;
    for (const { name, index } of measureColumns) {
      const cell = (cells[index] ?? "").trim();
      if (cell === "") continue;
      const parsed = normalizeNumber(cell);
      if ("error" in parsed) row.errors.push(`${name}: ${parsed.error}`);
      else row.values.push({ measure: name, value: parsed.value });
    }
    if (row.values.length === 0 && row.errors.length === 0) row.errors.push("no values on this row");
    if (row.values.length > MAX_MEASURES_PER_ROW) row.errors.push(`more than ${MAX_MEASURES_PER_ROW} values`);
    if (row.unitId && start && end) {
      const key = `${row.unitId}|${start}|${end}`;
      if (seen.has(key)) row.errors.push("this unit and period appear on an earlier row; combine them into one row");
      seen.add(key);
    }
    return row;
  });
  return { fileErrors, rows, ready: rows.filter((row) => row.errors.length === 0) };
}

// ---------------------------------------------------------------------------
// The format and the guide
// ---------------------------------------------------------------------------

/** Measures the chosen KPIs need, or every measure if no KPI is chosen. */
export function measuresFor(workspace: SaasWorkspace, kpiIds: readonly string[] | null): Measure[] {
  if (kpiIds === null) return workspace.measures;
  const wanted = new Set<string>();
  for (const kpi of workspace.kpis)
    if (kpiIds.includes(kpi.id)) for (const key of formulaMeasureKeys(kpi.formula)) wanted.add(key);
  return workspace.measures.filter((m) => wanted.has(m.key));
}

/** The CSV a team fills in: one empty row per unit for the chosen period. */
export function templateCsv(
  workspace: SaasWorkspace,
  options: { measures: readonly Measure[]; unitIds: readonly string[]; start: string; end: string },
): string {
  const header = [...FIXED_COLUMNS, ...options.measures.map((m) => m.key)];
  const names = new Map(workspace.units.map((u) => [u.id, u.name]));
  const rows = options.unitIds.map((id) => [names.get(id) ?? id, options.start, options.end, ...options.measures.map(() => "")]);
  return toCsv([header, ...rows]);
}

/** A plain-language guide to every column: what to enter, in which unit, and which KPIs use it. */
export function guideCsv(workspace: SaasWorkspace, measures: readonly Measure[]): string {
  const usedBy = new Map<string, string[]>();
  for (const kpi of workspace.kpis.filter((k) => k.state === "active"))
    for (const key of formulaMeasureKeys(kpi.formula)) (usedBy.get(key) ?? usedBy.set(key, []).get(key)!).push(kpi.name);
  const rows: string[][] = [
    ["column", "what to enter", "unit", "description", "adds up across units", "used by KPIs"],
    ["unit", "The exact unit name, as it appears in your organization", "text", "One row per unit and period.", "", ""],
    ["period_start", "First day of the period", "date", "For example 2026-09-01 or 01/09/2026.", "", ""],
    ["period_end", "Last day of the period", "date", "For example 2026-09-30 or 30/09/2026.", "", ""],
    ...measures.map((m) => [
      m.key,
      `${m.name}, as a plain number`,
      m.unit,
      m.description || m.name,
      m.rollsUp ? "yes: a parent unit can be added up from its children" : "no: enter it for each unit",
      (usedBy.get(m.key) ?? []).join("; "),
    ]),
  ];
  return toCsv(rows);
}

/** Default period for the format: last full calendar month. */
export function lastMonth(today = new Date()): { start: string; end: string } {
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
}

/** Whole-month period from an `<input type="month">` value like `2026-09`. */
export function monthPeriod(value: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return {
    start: `${match[1]}-${match[2]}-01`,
    end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
}

export type { Kpi, Measure };

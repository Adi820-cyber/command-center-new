/**
 * Display helpers shared by the dashboard, the CSV guide and Ask, so a figure
 * reads the same everywhere. None of this changes a stored value.
 */

const GROUPED = new Map<number, Intl.NumberFormat>();
function grouped(digits: number): Intl.NumberFormat {
  let format = GROUPED.get(digits);
  if (!format) {
    format = new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits });
    GROUPED.set(digits, format);
  }
  return format;
}

const PLAIN: Record<string, string> = {
  currency: "",
  count: "",
  "%": "%",
  days: " days",
  hours: " hours",
  minutes: " min",
  units: " units",
  kwh: " kWh",
  km: " km",
  sqft: " sq ft",
  acres: " acres",
  kg: " kg",
  tonnes: " t",
  litres: " L",
  years: " years",
  points: " points",
  rounds: " rounds",
};
const NUMERATOR: Record<string, string> = {
  currency: "",
  count: "items",
  days: "days",
  hours: "hours",
  minutes: "min",
  units: "units",
  kwh: "kWh",
  km: "km",
  sqft: "sq ft",
  kg: "kg",
  tonnes: "t",
  litres: "L",
  years: "years",
  acres: "acres",
  points: "points",
  rounds: "rounds",
};
const DENOMINATOR: Record<string, string> = {
  count: "item",
  currency: "currency unit",
  days: "day",
  hours: "hour",
  minutes: "minute",
  units: "unit",
  km: "km",
  kg: "kg",
  sqft: "sq ft",
  tonnes: "tonne",
  litres: "litre",
  years: "year",
  acres: "acre",
  kwh: "kWh",
};

/** The words that follow a number, for example " days" or " per item". */
export function unitLabel(unit: string): string {
  if (unit === "1") return "×";
  if (!unit.includes("/")) return PLAIN[unit] ?? ` ${unit}`;
  const [top = "", bottom = ""] = unit.split("/");
  const numerator = top
    .split("*")
    .map((atom) => NUMERATOR[atom] ?? atom)
    .filter(Boolean)
    .join(" ");
  const denominator = bottom
    .split("*")
    .map((atom) => DENOMINATOR[atom] ?? atom)
    .join(" ");
  return ` ${numerator ? `${numerator} ` : ""}per ${denominator}`;
}

/** `26.1904761905` with unit `%` becomes `26.19%`. */
export function formatKpiValue(value: string, unit: string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  if (unit === "%") return `${grouped(2).format(number)}%`;
  const digits = Math.abs(number) >= 1000 ? 0 : 2;
  const label = unitLabel(unit);
  return `${grouped(digits).format(number)}${label === "×" ? "×" : label}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-09-01`..`2026-09-30` becomes `Sep 2026`; other spans show their dates. */
export function periodLabel(start: string, end: string): string {
  const cleanStart = String(start).slice(0, 10);
  const cleanEnd = String(end).slice(0, 10);
  const [sy = 0, sm = 1, sd = 1] = cleanStart.split("-").map(Number);
  const [ey = 0, em = 1, ed = 1] = cleanEnd.split("-").map(Number);
  const lastDay = new Date(Date.UTC(ey, em, 0)).getUTCDate();
  if (sd === 1 && ed === lastDay) {
    if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sy}`;
    return `${MONTHS[sm - 1]} ${sy} – ${MONTHS[em - 1]} ${ey}`;
  }
  return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]} ${ey}`;
}

export type Tone = "good" | "bad" | "neutral";

/** Whether a move from `previous` to `current` is an improvement for this KPI. */
export function changeTone(
  direction: "higher" | "lower" | "neutral",
  current: number,
  previous: number,
): Tone {
  if (direction === "neutral" || current === previous) return "neutral";
  const up = current > previous;
  return (direction === "higher") === up ? "good" : "bad";
}

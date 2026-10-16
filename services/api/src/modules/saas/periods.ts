/**
 * Reporting-period arithmetic on ISO dates (YYYY-MM-DD), always in UTC so a
 * server time zone can never move a boundary.
 *
 * A period that covers whole calendar months (1 Jan to 31 Mar) moves by whole
 * months: its previous period is 1 Oct to 31 Dec. Any other period moves by
 * its own length in days.
 */

export interface Period {
  start: string;
  end: string;
}
export type PeriodShift = "previous" | "year_ago" | "next" | "year_after";

const DAY = 86_400_000;
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

export function daysInPeriod(period: Period): number {
  return Math.round((toDate(period.end).getTime() - toDate(period.start).getTime()) / DAY) + 1;
}

const lastDayOf = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** Months spanned when the period is whole calendar months, otherwise null. */
function wholeMonths(period: Period): number | null {
  const start = toDate(period.start);
  const end = toDate(period.end);
  if (start.getUTCDate() !== 1) return null;
  if (end.getUTCDate() !== lastDayOf(end.getUTCFullYear(), end.getUTCMonth())) return null;
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    1
  );
}

function addMonths(period: Period, months: number): Period {
  const start = toDate(period.start);
  const end = toDate(period.end);
  const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + months, 1));
  const lastDay = lastDayOf(endMonth.getUTCFullYear(), endMonth.getUTCMonth());
  return {
    start: toIso(first),
    end: toIso(new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth(), lastDay))),
  };
}

function addDays(period: Period, days: number): Period {
  const move = (iso: string) => toIso(new Date(toDate(iso).getTime() + days * DAY));
  return { start: move(period.start), end: move(period.end) };
}

/** The same calendar dates one year later (or earlier), clamping 29 February. */
function addYears(period: Period, years: number): Period {
  const move = (iso: string) => {
    const date = toDate(iso);
    const year = date.getUTCFullYear() + years;
    const day = Math.min(date.getUTCDate(), lastDayOf(year, date.getUTCMonth()));
    return toIso(new Date(Date.UTC(year, date.getUTCMonth(), day)));
  };
  return { start: move(period.start), end: move(period.end) };
}

export function shiftPeriod(period: Period, shift: PeriodShift): Period {
  const months = wholeMonths(period);
  const length = daysInPeriod(period);
  switch (shift) {
    case "previous":
      return months !== null ? addMonths(period, -months) : addDays(period, -length);
    case "next":
      return months !== null ? addMonths(period, months) : addDays(period, length);
    case "year_ago":
      return months !== null ? addMonths(period, -12) : addYears(period, -1);
    case "year_after":
      return months !== null ? addMonths(period, 12) : addYears(period, 1);
  }
}

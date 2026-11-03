// Pure ROI math for the calculator — no DOM, so it runs under node:test.
const WEEKS_PER_MONTH = 4.33;
const WEEKS_PER_YEAR = 52;
const HOURS_PER_WORKDAY = 8;
const DEFAULT_AUTOMATION_SHARE = 0.7;

const rubFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

function toNonNegative(value) {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function roundTo(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function calcRoi({ hoursPerWeek, hourlyRate, automationShare = DEFAULT_AUTOMATION_SHARE }) {
  const share = Math.min(toNonNegative(automationShare), 1);
  const freedPerWeek = toNonNegative(hoursPerWeek) * share;
  const freedPerMonth = freedPerWeek * WEEKS_PER_MONTH;

  return {
    hoursPerMonth: roundTo(freedPerMonth, 1),
    moneyPerMonth: Math.round(freedPerMonth * toNonNegative(hourlyRate)),
    workdaysPerYear: roundTo((freedPerWeek * WEEKS_PER_YEAR) / HOURS_PER_WORKDAY, 1),
  };
}

const numFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export function formatNum(value) {
  return numFormatter.format(toNonNegative(value));
}

export function formatRub(amount) {
  return `${rubFormatter.format(toNonNegative(amount))} ₽`;
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { calcRoi, formatNum, formatRub } from "../js/roi-math.js";

test("formats decimals with a ru-RU comma", () => {
  assert.equal(formatNum(30.3), "30,3");
  assert.equal(formatNum(45), "45");
});

test("returns monthly hours, money and yearly workdays for typical input", () => {
  const r = calcRoi({ hoursPerWeek: 10, hourlyRate: 2000, automationShare: 0.7 });
  assert.equal(r.hoursPerMonth, 30.3);
  assert.equal(r.moneyPerMonth, 60620);
  assert.equal(r.workdaysPerYear, 45.5);
});

test("returns zeros when routine hours are zero", () => {
  const r = calcRoi({ hoursPerWeek: 0, hourlyRate: 5000, automationShare: 0.7 });
  assert.deepEqual(r, { hoursPerMonth: 0, moneyPerMonth: 0, workdaysPerYear: 0 });
});

test("treats negative, NaN and non-numeric input as zero", () => {
  const r = calcRoi({ hoursPerWeek: -5, hourlyRate: Number.NaN, automationShare: "x" });
  assert.deepEqual(r, { hoursPerMonth: 0, moneyPerMonth: 0, workdaysPerYear: 0 });
});

test("clamps automation share to the 0..1 range", () => {
  const capped = calcRoi({ hoursPerWeek: 10, hourlyRate: 1000, automationShare: 3 });
  const full = calcRoi({ hoursPerWeek: 10, hourlyRate: 1000, automationShare: 1 });
  assert.deepEqual(capped, full);
});

test("uses the default 70% share when none is given", () => {
  const r = calcRoi({ hoursPerWeek: 10, hourlyRate: 2000 });
  assert.equal(r.hoursPerMonth, 30.3);
});

test("formats rubles with ru-RU grouping and the ruble sign", () => {
  assert.match(formatRub(60620), /^60\s620\s₽$/u);
  assert.match(formatRub(0), /^0\s₽$/u);
});

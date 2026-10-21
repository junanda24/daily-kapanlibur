import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDate,
  toISO,
  todayISO,
  dayOfWeek,
  isWeekend,
  dayName,
  formatId,
  formatShort,
  addDays,
  diffDays,
  isLeapYear,
  allDatesOfYear,
} from '../src/dates.js';

describe('parseDate', () => {
  it('parse tanggal valid', () => {
    assert.deepEqual(parseDate('2026-12-25'), { y: 2026, m: 12, d: 25 });
  });
  it('tolak format salah', () => {
    assert.equal(parseDate('25-12-2026'), null);
    assert.equal(parseDate('2026/12/25'), null);
    assert.equal(parseDate(''), null);
    assert.equal(parseDate(null), null);
  });
  it('tolak tanggal fiktif (2026-02-30)', () => {
    assert.equal(parseDate('2026-02-30'), null);
    assert.equal(parseDate('2026-13-01'), null);
    assert.equal(parseDate('2026-00-10'), null);
  });
  it('terima 29 Feb di tahun kabisat, tolak di bukan kabisat', () => {
    assert.notEqual(parseDate('2024-02-29'), null);
    assert.equal(parseDate('2026-02-29'), null);
  });
});

describe('hari & format Indonesia', () => {
  it('25 Des 2026 = Jumat (bukan geser timezone)', () => {
    assert.equal(dayName('2026-12-25'), 'Jumat');
    assert.equal(dayOfWeek('2026-12-25'), 5);
  });
  it('formatId Indonesia', () => {
    assert.equal(formatId('2026-12-25'), 'Jumat, 25 Desember 2026');
    assert.equal(formatId('2026-01-01'), 'Kamis, 1 Januari 2026');
  });
  it('formatShort', () => {
    assert.equal(formatShort('2026-03-19'), '19 Mar 2026');
  });
  it('isWeekend', () => {
    assert.equal(isWeekend('2026-10-24'), true); // Sabtu
    assert.equal(isWeekend('2026-10-25'), true); // Minggu
    assert.equal(isWeekend('2026-10-21'), false); // Rabu
  });
});

describe('aritmetika tanggal', () => {
  it('addDays lintas bulan & tahun', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  });
  it('diffDays', () => {
    assert.equal(diffDays('2026-01-02', '2026-01-01'), 1);
    assert.equal(diffDays('2026-12-25', '2026-10-21'), 65);
    assert.equal(diffDays('2026-01-01', '2026-01-01'), 0);
  });
  it('toISO & todayISO konsisten', () => {
    assert.equal(toISO({ y: 2026, m: 3, d: 5 }), '2026-03-05');
    assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
  });
  it('allDatesOfYear 2026 = 365 hari, diawali & diakhiri benar', () => {
    const ds = allDatesOfYear(2026);
    assert.equal(ds.length, 365);
    assert.equal(ds[0], '2026-01-01');
    assert.equal(ds[364], '2026-12-31');
    assert.equal(allDatesOfYear(2024).length, 366);
  });
  it('isLeapYear', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2026), false);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(1900), false);
  });
});

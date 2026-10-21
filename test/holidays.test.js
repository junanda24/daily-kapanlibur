import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadYear, bundledYears } from '../src/data.js';
import {
  prepareYear,
  dayStatus,
  isHoliday,
  holidayName,
  nextHolidays,
  todayInfo,
  parseYearInput,
} from '../src/holidays.js';

describe('data bundel', () => {
  it('2026: 17 nasional + 8 cuti bersama, tanpa duplikat', () => {
    const doc = loadYear(2026);
    assert.ok(doc);
    const nas = doc.holidays.filter((h) => h.type === 'nasional');
    const cb = doc.holidays.filter((h) => h.type === 'cuti-bersama');
    assert.equal(nas.length, 17);
    assert.equal(cb.length, 8);
    const dates = doc.holidays.map((h) => h.date);
    assert.equal(new Set(dates).size, dates.length);
  });
  it('2026 memuat tanggal kunci SKB', () => {
    const doc = prepareYear(2026);
    assert.equal(holidayName('2026-03-19', doc), 'Hari Suci Nyepi (Tahun Baru Saka 1948)');
    assert.equal(holidayName('2026-12-25', doc), 'Hari Raya Natal');
    assert.equal(dayStatus('2026-03-18', doc), 'cuti-bersama');
  });
  it('tahun tanpa data -> null', () => {
    assert.equal(loadYear(2030), null);
    assert.equal(prepareYear(2030), null);
  });
  it('bundledYears memuat 2025 & 2026', () => {
    const ys = bundledYears();
    assert.ok(ys.includes(2025));
    assert.ok(ys.includes(2026));
  });
});

describe('dayStatus', () => {
  const doc = prepareYear(2026);
  it('libur nasional terdeteksi', () => {
    assert.equal(dayStatus('2026-08-17', doc), 'nasional');
  });
  it('cuti bersama terdeteksi', () => {
    assert.equal(dayStatus('2026-12-24', doc), 'cuti-bersama');
  });
  it('weekend terdeteksi', () => {
    assert.equal(dayStatus('2026-10-24', doc), 'weekend'); // Sabtu biasa
  });
  it('hari kerja biasa', () => {
    assert.equal(dayStatus('2026-10-21', doc), 'kerja'); // Rabu biasa
  });
  it('isHoliday true untuk merah/weekend', () => {
    assert.equal(isHoliday('2026-08-17', doc), true);
    assert.equal(isHoliday('2026-10-24', doc), true);
    assert.equal(isHoliday('2026-10-21', doc), false);
  });
});

describe('nextHolidays', () => {
  it('dari 2026-10-21: cuti bersama Natal 24 Des, 64 hari lagi', () => {
    const next = nextHolidays('2026-10-21', 1);
    assert.equal(next.length, 1);
    assert.equal(next[0].date, '2026-12-24'); // cuti bersama juga tanggal merah
    assert.equal(next[0].type, 'cuti-bersama');
    assert.equal(next[0].daysAway, 64);
  });
  it('melewati pergantian tahun (2026-12-26 -> 2027?) — 2027 tak ada data, hasil boleh kosong', () => {
    const next = nextHolidays('2026-12-26', 3);
    assert.ok(Array.isArray(next));
    // 2027 tidak dibundel: tidak boleh crash, tidak boleh ngarang
    assert.equal(next.length, 0);
  });
  it('3 berikutnya dari awal tahun', () => {
    const next = nextHolidays('2025-12-31', 3);
    assert.deepEqual(
      next.map((h) => h.date),
      ['2026-01-01', '2026-01-16', '2026-02-16'],
    );
  });
});

describe('todayInfo', () => {
  it('mengembalikan struktur lengkap tanpa throw', () => {
    const info = todayInfo();
    assert.match(info.today, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(['nasional', 'cuti-bersama', 'weekend', 'kerja'].includes(info.status));
    assert.equal(typeof info.hasData, 'boolean');
  });
});

describe('parseYearInput', () => {
  it('valid & fallback', () => {
    assert.equal(parseYearInput('2026', 2026), 2026);
    assert.equal(parseYearInput(undefined, 2026), 2026);
    assert.equal(parseYearInput('', 2026), 2026);
  });
  it('invalid -> null', () => {
    assert.equal(parseYearInput('abc', 2026), null);
    assert.equal(parseYearInput('1999', 2026), null);
    assert.equal(parseYearInput('20.5', 2026), null);
  });
});

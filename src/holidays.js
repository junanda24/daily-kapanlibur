// LOGIC BISNIS soal hari libur. Pure function — tanpa I/O, tanpa argv.

import { isWeekend, todayISO, diffDays, parseDate } from './dates.js';
import { loadYear } from './data.js';

// Status: 'nasional' | 'cuti-bersama' | 'weekend' | 'kerja'
export function dayStatus(iso, yearDoc) {
  const hit = yearDoc.byDate.get(iso);
  if (hit) return hit.type;
  return isWeekend(iso) ? 'weekend' : 'kerja';
}

export function isHoliday(iso, yearDoc) {
  const s = dayStatus(iso, yearDoc);
  return s === 'nasional' || s === 'cuti-bersama' || s === 'weekend';
}

export function holidayName(iso, yearDoc) {
  const hit = yearDoc.byDate.get(iso);
  return hit ? hit.name : null;
}

// Bungkus dokumen tahun mentah -> { year, holidays, byDate: Map, source, note, fromCache }
export function prepareYear(year) {
  const doc = loadYear(year);
  if (!doc) return null;
  const byDate = new Map();
  for (const h of doc.holidays) {
    if (!byDate.has(h.date)) byDate.set(h.date, h); // duplikat: yang pertama menang
  }
  return { ...doc, byDate };
}

// N tanggal merah berikutnya sejak fromIso (eksklusif), antar-tahun bila perlu.
export function nextHolidays(fromIso, count = 3, maxYearSpan = 3) {
  const out = [];
  const fromYear = Number(fromIso.slice(0, 4));
  for (let y = fromYear; y < fromYear + maxYearSpan && out.length < count; y += 1) {
    const doc = prepareYear(y);
    if (!doc) continue; // tahun tanpa data: lewati diam-diam, bukan error
    const sorted = [...doc.holidays].sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const h of sorted) {
      if (h.date > fromIso && out.length < count) {
        out.push({ ...h, daysAway: diffDays(h.date, fromIso) });
      }
    }
  }
  return out;
}

// Info "hari ini": status + tanggal merah berikutnya.
export function todayInfo() {
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const doc = prepareYear(year);
  const status = doc ? dayStatus(today, doc) : 'kerja';
  const name = doc ? holidayName(today, doc) : null;
  const upcoming = nextHolidays(today, 1);
  return {
    today,
    status,
    name,
    next: upcoming[0] || null,
    hasData: doc !== null,
  };
}

export function parseYearInput(raw, fallbackYear) {
  if (raw === undefined || raw === null || raw === '') return fallbackYear;
  const y = Number(raw);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return null;
  return y;
}

export { parseDate };

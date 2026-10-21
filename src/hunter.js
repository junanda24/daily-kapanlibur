// LOGIC BISNIS: pemburu libur kejepit + optimizer cuti. Pure function.

import { allDatesOfYear, addDays, isWeekend } from './dates.js';
import { prepareYear, dayStatus } from './holidays.js';

function isOff(iso, doc) {
  return dayStatus(iso, doc) !== 'kerja';
}

function redDaysInRange(startIso, endIso, doc) {
  const out = [];
  let cur = startIso;
  for (;;) {
    const hit = doc.byDate.get(cur);
    if (hit) out.push(hit);
    if (cur === endIso) break;
    cur = addDays(cur, 1);
  }
  return out;
}

// Semua run hari-libur-berturut-turut (minLength hari) dalam setahun.
// Run = Sabtu/Minggu + libur nasional + cuti bersama yang bersambungan.
export function findLongWeekends(year, minLength = 3) {
  const doc = prepareYear(year);
  if (!doc) return null;
  const dates = allDatesOfYear(year);
  const clusters = [];
  let runStart = null;

  const closeRun = (endIso) => {
    const start = runStart;
    runStart = null;
    let len = 0;
    let c = start;
    for (;;) {
      len += 1;
      if (c === endIso) break;
      c = addDays(c, 1);
    }
    if (len >= minLength) {
      clusters.push({
        start,
        end: endIso,
        totalDays: len,
        redDays: redDaysInRange(start, endIso, doc),
        leaveNeeded: 0,
      });
    }
  };

  for (const iso of dates) {
    if (isOff(iso, doc)) {
      if (runStart === null) runStart = iso;
    } else if (runStart !== null) {
      closeRun(addDays(iso, -1));
    }
  }
  if (runStart !== null) closeRun(dates[dates.length - 1]);
  return clusters;
}

// Optimizer cuti: dengan maxLeave hari cuti, jendela libur beruntun
// terpanjang apa yang bisa didapat? Jendela harus mengandung >= 1 tanggal
// merah (mencegah rekomendasi minggu acak saat maxLeave besar).
export function suggestLeave(year, maxLeave = 2, topN = 5) {
  const doc = prepareYear(year);
  if (!doc) return null;
  const dates = allDatesOfYear(year);
  const offSet = new Set(dates.filter((d) => isOff(d, doc)));
  const candidates = [];

  for (let i = 0; i < dates.length; i += 1) {
    const start = dates[i];
    for (let len = 4; len <= 14; len += 1) {
      const end = addDays(start, len - 1);
      if (!end.startsWith(String(year))) break; // jangan lewati tahun
      const leaveDates = [];
      let redCount = 0;
      let cur = start;
      for (let k = 0; k < len; k += 1) {
        if (!offSet.has(cur) && !isWeekend(cur)) leaveDates.push(cur);
        if (doc.byDate.has(cur)) redCount += 1;
        cur = addDays(cur, 1);
      }
      if (leaveDates.length <= maxLeave && redCount >= 1) {
        candidates.push({
          start,
          end,
          totalDays: len,
          leaveUsed: leaveDates.length,
          leaveDates,
          redDays: redDaysInRange(start, end, doc),
        });
      }
    }
  }

  candidates.sort(
    (a, b) => b.totalDays - a.totalDays || a.leaveUsed - b.leaveUsed || (a.start < b.start ? -1 : 1),
  );

  // Deduplikasi: jendela yang tumpang tindih penuh -> ambil yang terbaik.
  const picked = [];
  const overlaps = (x, y) => x.start <= y.end && y.start <= x.end;
  for (const c of candidates) {
    if (picked.length >= topN) break;
    const dominated = picked.some(
      (p) => overlaps(p, c) && p.totalDays >= c.totalDays && p.leaveUsed <= c.leaveUsed,
    );
    if (!dominated) picked.push(c);
  }
  return picked;
}

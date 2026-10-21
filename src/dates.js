// Util tanggal murni — tidak tahu apa-apa soal hari libur.
// PENTING: jangan pernah pakai new Date('YYYY-MM-DD') — itu di-parse sebagai
// UTC dan bisa menggeser hari di zona WIB. Selalu parse manual (waktu lokal).

const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n) {
  return String(n).padStart(2, '0');
}

// 'YYYY-MM-DD' -> { y, m, d } atau null bila tidak valid (termasuk 2026-02-30)
export function parseDate(str) {
  if (typeof str !== 'string') return null;
  const m = DATE_RE.exec(str.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d); // konstruktor lokal, bukan UTC
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null; // tanggal fiktif seperti 2026-02-30
  }
  return { y, m: mo, d };
}

export function toISO(part) {
  return `${part.y}-${pad2(part.m)}-${pad2(part.d)}`;
}

function toDate(part) {
  return new Date(part.y, part.m - 1, part.d);
}

export function todayISO() {
  const now = new Date();
  return toISO({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

// 0 = Minggu .. 6 = Sabtu (waktu lokal)
export function dayOfWeek(iso) {
  const p = parseDate(iso);
  if (!p) throw new Error(`tanggal tidak valid: ${iso}`);
  return toDate(p).getDay();
}

export function isWeekend(iso) {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

export function dayName(iso) {
  return DAY_NAMES[dayOfWeek(iso)];
}

// 'Jumat, 25 Desember 2026'
export function formatId(iso) {
  const p = parseDate(iso);
  if (!p) throw new Error(`tanggal tidak valid: ${iso}`);
  return `${DAY_NAMES[toDate(p).getDay()]}, ${p.d} ${MONTH_NAMES[p.m - 1]} ${p.y}`;
}

// '25 Des 2026' (versi pendek untuk tabel)
export function formatShort(iso) {
  const p = parseDate(iso);
  if (!p) throw new Error(`tanggal tidak valid: ${iso}`);
  return `${p.d} ${MONTH_NAMES[p.m - 1].slice(0, 3)} ${p.y}`;
}

export function addDays(iso, n) {
  const p = parseDate(iso);
  if (!p) throw new Error(`tanggal tidak valid: ${iso}`);
  const dt = toDate(p);
  dt.setDate(dt.getDate() + n);
  return toISO({ y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() });
}

// selisih hari kalender: diffDays('2026-01-02', '2026-01-01') === 1
export function diffDays(aIso, bIso) {
  const a = parseDate(aIso);
  const b = parseDate(bIso);
  if (!a || !b) throw new Error('tanggal tidak valid');
  const ms = toDate(a).getTime() - toDate(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

// semua tanggal 'YYYY-MM-DD' dalam setahun, 1 Jan -> 31 Des
export function allDatesOfYear(year) {
  const days = isLeapYear(year) ? 366 : 365;
  const out = [];
  let cur = `${year}-01-01`;
  for (let i = 0; i < days; i += 1) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

// Network layer: unduh data terbaru dari API publik gratis -> tulis cache.
// Dipakai HANYA oleh perintah `refresh`. Gagal network = error jujur,
// data bundel tetap dipakai.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCacheDir } from './data.js';

const API_URL = 'https://api-harilibur.vercel.app/api';
const API_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function normalizeDate(raw) {
  const m = API_DATE_RE.exec(String(raw).trim());
  if (!m) return null;
  const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return iso;
}

// -> { year, count, source } atau throw Error dengan pesan yang jujur
export async function refreshData() {
  let res;
  try {
    res = await fetch(API_URL, { signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new Error(
      `tidak bisa mengunduh data dari ${API_URL} (network gagal). Data bawaan tetap dipakai.`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `server data menjawab HTTP ${res.status}. Data bawaan tetap dipakai.`,
    );
  }
  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new Error('respon server bukan JSON yang valid. Data bawaan tetap dipakai.');
  }
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('format data dari server tidak dikenali. Data bawaan tetap dipakai.');
  }

  const holidays = [];
  const seen = new Set();
  for (const item of payload) {
    if (!item || typeof item.holiday_name !== 'string') continue;
    const iso = normalizeDate(item.holiday_date);
    if (!iso || seen.has(iso)) continue;
    seen.add(iso);
    // API menandai hari regional (Galungan dsb.) sebagai non-nasional —
    // itu BUKAN cuti bersama, jadi hanya nasional yang diambil.
    if (item.is_national_holiday === false) continue;
    holidays.push({ date: iso, name: item.holiday_name.trim(), type: 'nasional' });
  }
  if (holidays.length === 0) {
    throw new Error('tidak ada tanggal merah nasional pada respon server. Data bawaan tetap dipakai.');
  }

  holidays.sort((a, b) => (a.date < b.date ? -1 : 1));
  const year = Number(holidays[0].date.slice(0, 4));
  const doc = {
    year,
    source: `${API_URL} (diunduh ${new Date().toISOString().slice(0, 10)})`,
    note: 'Data hasil refresh hanya mencakup libur nasional dari API publik; cuti bersama tidak termasuk.',
    holidays,
  };

  const dir = getCacheDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${year}.json`), `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  return { year, count: holidays.length, source: API_URL, cacheFile: join(dir, `${year}.json`) };
}

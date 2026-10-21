// Satu-satunya modul yang menyentuh filesystem untuk data libur.
// Prioritas: cache hasil `refresh` (bila ada & tahun cocok) -> data bundel.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'data');

function cacheDir() {
  if (platform() === 'win32') {
    const base = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
    return join(base, 'kapanlibur', 'cache');
  }
  const base = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
  return join(base, 'kapanlibur');
}

export function getCacheDir() {
  return cacheDir();
}

function readJsonFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isValidBundle(doc, year) {
  if (!doc || doc.year !== year || !Array.isArray(doc.holidays)) return false;
  return doc.holidays.every(
    (h) =>
      typeof h.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(h.date) &&
      typeof h.name === 'string' &&
      h.name.length > 0 &&
      (h.type === 'nasional' || h.type === 'cuti-bersama'),
  );
}

// -> { year, holidays, source, note?, fromCache } atau null bila tak ada data
export function loadYear(year) {
  const cached = readJsonFile(join(cacheDir(), `${year}.json`));
  if (isValidBundle(cached, year)) {
    return { ...cached, fromCache: true };
  }
  const bundled = readJsonFile(join(DATA_DIR, `${year}.json`));
  if (isValidBundle(bundled, year)) {
    return { ...bundled, fromCache: false };
  }
  return null;
}

// Tahun-tahun yang datanya dibundel (dibaca dari data/, tanpa hardcode).
export function bundledYears() {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .map((f) => Number(f.slice(0, 4)))
    .sort((a, b) => a - b);
}

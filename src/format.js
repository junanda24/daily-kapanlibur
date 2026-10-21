// Format output terminal: warna ANSI + tabel + tanggal Indonesia.
// Warna mati otomatis bila bukan TTY atau NO_COLOR diset.

import { formatId, formatShort, dayName } from './dates.js';

const NO_COLOR = !process.stdout.isTTY || process.env.NO_COLOR !== undefined;

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function paint(code, text) {
  if (NO_COLOR) return text;
  return `${C[code]}${text}${C.reset}`;
}

export const bold = (t) => paint('bold', t);
export const dim = (t) => paint('dim', t);
export const red = (t) => paint('red', t);
export const green = (t) => paint('green', t);
export const yellow = (t) => paint('yellow', t);
export const cyan = (t) => paint('cyan', t);
export const magenta = (t) => paint('magenta', t);

export const TYPE_LABEL = {
  nasional: 'LIBUR NASIONAL',
  'cuti-bersama': 'CUTI BERSAMA',
  weekend: 'AKHIR PEKAN',
  kerja: 'HARI KERJA',
};

export function colorForType(type) {
  if (type === 'nasional') return red;
  if (type === 'cuti-bersama') return yellow;
  if (type === 'weekend') return cyan;
  return green;
}

export function statusLine(status, name) {
  const label = TYPE_LABEL[status] || status;
  const colored = colorForType(status)(bold(label));
  return name ? `${colored} — ${name}` : colored;
}

// Tabel teks sederhana: [[kolom...], ...] -> string berbaris
export function table(rows) {
  const widths = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      const len = String(cell).replace(/\x1b\[[0-9;]*m/g, '').length;
      widths[i] = Math.max(widths[i] || 0, len);
    });
  }
  return rows
    .map((row) =>
      row
        .map((cell, i) => {
          const plain = String(cell).replace(/\x1b\[[0-9;]*m/g, '');
          return `${cell}${' '.repeat(widths[i] - plain.length)}`;
        })
        .join('  '),
    )
    .join('\n');
}

export function rangeLabel(startIso, endIso) {
  if (startIso === endIso) return formatId(startIso);
  return `${formatShort(startIso)} – ${formatId(endIso)}`;
}

export function dayNameOf(iso) {
  return dayName(iso);
}

export const CUTI_BERSAMA_NOTE = dim(
  'Catatan: cuti bersama memotong jatah cuti tahunan (aturan SKB; swasta mengikuti kebijakan perusahaan).',
);

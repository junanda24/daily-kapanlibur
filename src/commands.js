// Tiap command: ambil data lewat modul logic -> format -> tulis stdout.
// Tidak ada logika tanggal di sini; tidak ada parsing argv di sini.

import {
  bold,
  green,
  dim,
  yellow,
  red,
  statusLine,
  table,
  rangeLabel,
  colorForType,
  TYPE_LABEL,
  CUTI_BERSAMA_NOTE,
} from './format.js';
import { formatId, formatShort, todayISO } from './dates.js';
import {
  todayInfo,
  nextHolidays,
  dayStatus,
  holidayName,
  prepareYear,
  parseYearInput,
} from './holidays.js';
import { findLongWeekends, suggestLeave } from './hunter.js';
import { bundledYears } from './data.js';

function redRow(h) {
  const paint = colorForType(h.type);
  return [formatShort(h.date), paint(TYPE_LABEL[h.type]), h.name];
}

export function cmdToday() {
  const info = todayInfo();
  const lines = [];
  lines.push(bold('KapanLibur'));
  lines.push(`${dim('Hari ini:')} ${formatId(info.today)}`);
  lines.push(statusLine(info.status, info.name));
  if (info.next) {
    const n = info.next;
    const when = n.daysAway === 1 ? 'besok' : `${n.daysAway} hari lagi`;
    lines.push('');
    lines.push(
      `${dim('Tanggal merah berikutnya:')} ${bold(n.name)} — ${formatId(n.date)} ${dim(`(${when})`)}`,
    );
  } else {
    lines.push('');
    lines.push(dim('Belum ada data tanggal merah berikutnya.'));
  }
  if (!info.hasData) {
    lines.push(yellow('Data tahun berjalan belum tersedia — jalankan `kapanlibur refresh`.'));
  }
  return { code: 0, out: lines.join('\n') };
}

export function cmdNext(args) {
  let count = 3;
  const nIdx = args.indexOf('-n');
  if (nIdx !== -1) {
    const v = Number(args[nIdx + 1]);
    if (!Number.isInteger(v) || v < 1 || v > 20) {
      return { code: 1, out: 'Jumlah tidak valid. Contoh: kapanlibur next -n 5' };
    }
    count = v;
  }
  const list = nextHolidays(todayISO(), count);
  if (list.length === 0) {
    return { code: 1, out: 'Belum ada data tanggal merah. Coba `kapanlibur refresh`.' };
  }
  const lines = [bold(`${count} tanggal merah berikutnya:`), ''];
  for (const h of list) {
    const when = h.daysAway === 1 ? 'besok' : `${h.daysAway} hari lagi`;
    lines.push(`- ${formatId(h.date)} ${dim(`(${when})`)}`);
    lines.push(`  ${statusLine(h.type, h.name)}`);
  }
  return { code: 0, out: lines.join('\n') };
}

export function cmdList(args) {
  const yIdx = args.indexOf('--year');
  const year = parseYearInput(yIdx === -1 ? undefined : args[yIdx + 1], Number(todayISO().slice(0, 4)));
  if (year === null) {
    return { code: 1, out: 'Tahun tidak valid. Contoh: kapanlibur list --year 2026' };
  }
  const doc = prepareYear(year);
  if (!doc) {
    return {
      code: 1,
      out: [
        `Data tahun ${year} belum tersedia.`,
        `Tahun yang dibundel: ${bundledYears().join(', ') || '-'}.`,
        'Jalankan `kapanlibur refresh` untuk mengunduh data terbaru.',
      ].join('\n'),
    };
  }
  const sorted = [...doc.holidays].sort((a, b) => (a.date < b.date ? -1 : 1));
  const lines = [
    bold(`Tanggal merah ${year} (${sorted.length} hari)`),
    dim(`Sumber: ${doc.source}`),
    '',
    table([['Tanggal', 'Jenis', 'Nama'], ...sorted.map(redRow)]),
  ];
  if (sorted.some((h) => h.type === 'cuti-bersama')) lines.push('', CUTI_BERSAMA_NOTE);
  if (doc.note) lines.push('', dim(`Catatan data: ${doc.note}`));
  return { code: 0, out: lines.join('\n') };
}

export function cmdCheck(args) {
  const raw = args[0];
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return {
      code: 1,
      out: ['Format tanggal tidak valid.', 'Contoh: kapanlibur cek 2026-12-25'].join('\n'),
    };
  }
  const year = Number(raw.slice(0, 4));
  const doc = prepareYear(year);
  if (!doc) {
    return { code: 1, out: `Data tahun ${year} belum tersedia.` };
  }
  // validasi tanggal fiktif (2026-02-30) — dayStatus akan throw via isWeekend
  let status;
  try {
    status = dayStatus(raw, doc);
  } catch {
    return {
      code: 1,
      out: ['Format tanggal tidak valid.', 'Contoh: kapanlibur cek 2026-12-25'].join('\n'),
    };
  }
  const name = holidayName(raw, doc);
  const lines = [`${formatId(raw)}:`, statusLine(status, name)];
  if (status === 'kerja') {
    const next = nextHolidays(raw, 1);
    if (next[0]) {
      lines.push(
        '',
        `${dim('Tanggal merah terdekat:')} ${next[0].name} — ${formatId(next[0].date)} ${dim(`(${next[0].daysAway} hari lagi)`)}`,
      );
    }
  }
  return { code: 0, out: lines.join('\n') };
}

export function cmdKejepit(args) {
  const yIdx = args.indexOf('--year');
  const year = parseYearInput(yIdx === -1 ? undefined : args[yIdx + 1], Number(todayISO().slice(0, 4)));
  if (year === null) {
    return { code: 1, out: 'Tahun tidak valid. Contoh: kapanlibur kejepit --year 2026' };
  }
  const clusters = findLongWeekends(year);
  if (clusters === null) {
    return { code: 1, out: `Data tahun ${year} belum tersedia.` };
  }
  if (clusters.length === 0) {
    return { code: 0, out: `Tidak ada libur panjang (3+ hari) di ${year}.` };
  }
  const lines = [bold(`Pemburu libur kejepit ${year}: ${clusters.length} periode`), ''];
  clusters.forEach((c, i) => {
    lines.push(`${bold(`${i + 1}. ${rangeLabel(c.start, c.end)}`)} — ${green(`${c.totalDays} hari libur`)}`);
    for (const h of c.redDays) {
      lines.push(`   ${dim('•')} ${formatShort(h.date)} ${colorForType(h.type)(TYPE_LABEL[h.type])}: ${h.name}`);
    }
    lines.push(`   ${dim('Modal cuti: 0 hari (murni)')}`);
    lines.push('');
  });
  lines.push(CUTI_BERSAMA_NOTE);
  lines.push(dim('Mau lebih panjang? Coba: kapanlibur cuti 2'));
  return { code: 0, out: lines.join('\n').trimEnd() };
}

export function cmdCuti(args) {
  const rawN = args[0];
  const maxLeave = rawN === undefined ? 2 : Number(rawN);
  if (!Number.isInteger(maxLeave) || maxLeave < 1 || maxLeave > 10) {
    return {
      code: 1,
      out: ['Jumlah cuti tidak valid (1-10).', 'Contoh: kapanlibur cuti 2'].join('\n'),
    };
  }
  const year = Number(todayISO().slice(0, 4));
  const picks = suggestLeave(year, maxLeave);
  if (picks === null) {
    return { code: 1, out: `Data tahun ${year} belum tersedia.` };
  }
  if (picks.length === 0) {
    return { code: 0, out: 'Tidak ada strategi cuti yang ditemukan.' };
  }
  const lines = [bold(`Strategi cuti ${year}: ${maxLeave} hari cuti → libur terpanjang`), ''];
  picks.forEach((p, i) => {
    lines.push(`${bold(`${i + 1}. ${rangeLabel(p.start, p.end)}`)} — ${green(`${p.totalDays} hari libur`)}`);
    if (p.leaveUsed === 0) {
      lines.push(`   ${dim('Tanpa ambil cuti — sudah nyambung sendiri.')}`);
    } else {
      const dates = p.leaveDates.map((d) => formatShort(d)).join(', ');
      lines.push(`   ${yellow(`Ambil cuti: ${dates}`)} ${dim(`(${p.leaveUsed} hari)`)}`);
    }
    const reds = p.redDays.map((h) => h.name).join('; ');
    if (reds) lines.push(`   ${dim(`Tanggal merah: ${reds}`)}`);
    lines.push('');
  });
  lines.push(CUTI_BERSAMA_NOTE);
  return { code: 0, out: lines.join('\n').trimEnd() };
}

export async function cmdRefresh() {
  const { refreshData } = await import('./refresh.js');
  try {
    const r = await refreshData();
    return {
      code: 0,
      out: [
        green(bold('Data berhasil diperbarui.')),
        `Tahun: ${r.year}, ${r.count} tanggal merah nasional.`,
        dim(`Sumber: ${r.source}`),
        dim(`Cache: ${r.cacheFile}`),
      ].join('\n'),
    };
  } catch (err) {
    return { code: 1, out: red(`Gagal refresh: ${err.message}`) };
  }
}

export function cmdHelp(version) {
  return {
    code: 0,
    out: [
      bold(`kapanlibur v${version}`),
      'CLI "kapan libur?" — tanggal merah Indonesia, pemburu libur kejepit, optimizer cuti.',
      '',
      bold('Perintah:'),
      '  kapanlibur                  Status hari ini + tanggal merah berikutnya',
      '  kapanlibur next [-n 5]      N tanggal merah berikutnya',
      '  kapanlibur list [--year Y]  Semua tanggal merah setahun',
      '  kapanlibur cek YYYY-MM-DD   Cek status satu tanggal',
      '  kapanlibur kejepit          Semua periode libur panjang (3+ hari)',
      '  kapanlibur cuti [n]         Strategi cuti optimal (default n=2)',
      '  kapanlibur refresh          Unduh data terbaru dari API publik',
      '  kapanlibur --help           Bantuan ini',
      '  kapanlibur --version        Versi',
      '',
      bold('Contoh:'),
      '  kapanlibur kejepit',
      '  kapanlibur cuti 1',
      '  kapanlibur cek 2026-12-25',
      '',
      dim('Data 2026: SKB 3 Menteri No. 1497, 2, 5 Tahun 2025. Tanpa login, tanpa database, offline-first.'),
    ].join('\n'),
  };
}

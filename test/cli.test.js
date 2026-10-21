import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'kapanlibur.js');

function runBin(args = []) {
  try {
    const out = execFileSync(process.execPath, [BIN, ...args], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status || 1, out: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

describe('CLI end-to-end', () => {
  it('tanpa argumen: status hari ini + tanggal merah berikutnya', () => {
    const r = runBin([]);
    assert.equal(r.code, 0);
    assert.match(r.out, /KapanLibur/);
    assert.match(r.out, /Hari ini:/);
    assert.match(r.out, /Tanggal merah berikutnya:/);
  });

  it('--help & --version', () => {
    const h = runBin(['--help']);
    assert.equal(h.code, 0);
    assert.match(h.out, /kejepit/);
    assert.match(h.out, /cuti/);
    const v = runBin(['--version']);
    assert.equal(v.code, 0);
    assert.match(v.out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('cek 2026-12-25 = LIBUR NASIONAL Natal', () => {
    const r = runBin(['cek', '2026-12-25']);
    assert.equal(r.code, 0);
    assert.match(r.out, /LIBUR NASIONAL/);
    assert.match(r.out, /Hari Raya Natal/);
  });

  it('cek tanggal kerja biasa -> HARI KERJA + tanggal merah terdekat', () => {
    const r = runBin(['cek', '2026-10-21']);
    assert.equal(r.code, 0);
    assert.match(r.out, /HARI KERJA/);
    assert.match(r.out, /Tanggal merah terdekat/);
  });

  it('cek format salah -> error + contoh', () => {
    const r = runBin(['cek', '25-12-2026']);
    assert.equal(r.code, 1);
    assert.match(r.out, /Contoh: kapanlibur cek 2026-12-25/);
  });

  it('cek tanggal fiktif 2026-02-30 -> error', () => {
    const r = runBin(['cek', '2026-02-30']);
    assert.equal(r.code, 1);
  });

  it('next -n 2 menampilkan 2 tanggal', () => {
    const r = runBin(['next', '-n', '2']);
    assert.equal(r.code, 0);
    assert.match(r.out, /2 tanggal merah berikutnya/);
  });

  it('next -n abc -> error', () => {
    const r = runBin(['next', '-n', 'abc']);
    assert.equal(r.code, 1);
  });

  it('list --year 2026: 25 baris tanggal', () => {
    const r = runBin(['list', '--year', '2026']);
    assert.equal(r.code, 0);
    assert.match(r.out, /Tanggal merah 2026 \(25 hari\)/);
    assert.match(r.out, /CUTI BERSAMA/);
  });

  it('list tahun tanpa data -> pesan jujur, bukan crash', () => {
    const r = runBin(['list', '--year', '2030']);
    assert.equal(r.code, 1);
    assert.match(r.out, /belum tersedia/);
  });

  it('kejepit: memuat cluster Idul Fitri 7 hari', () => {
    const r = runBin(['kejepit']);
    assert.equal(r.code, 0);
    assert.match(r.out, /18 Mar 2026/);
    assert.match(r.out, /7 hari libur/);
    assert.match(r.out, /Modal cuti: 0 hari/);
  });

  it('cuti 1: strategi terbaik 17 Mar -> 8 hari', () => {
    const r = runBin(['cuti', '1']);
    assert.equal(r.code, 0);
    assert.match(r.out, /17 Mar 2026/);
    assert.match(r.out, /8 hari libur/);
  });

  it('cuti 0 -> error', () => {
    const r = runBin(['cuti', '0']);
    assert.equal(r.code, 1);
  });

  it('perintah tak dikenal -> help + exit 1', () => {
    const r = runBin(['ngawur']);
    assert.equal(r.code, 1);
    assert.match(r.out, /Perintah tidak dikenal/);
  });
});

describe('library API', () => {
  it('named exports tersedia & berfungsi', async () => {
    const lib = await import('../src/index.js');
    assert.equal(typeof lib.isHoliday, 'function');
    assert.equal(typeof lib.findLongWeekends, 'function');
    assert.equal(typeof lib.suggestLeave, 'function');
    assert.equal(typeof lib.formatId, 'function');
    const doc = lib.prepareYear(2026);
    assert.equal(lib.isHoliday('2026-12-25', doc), true);
    assert.equal(lib.formatId('2026-12-25'), 'Jumat, 25 Desember 2026');
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findLongWeekends, suggestLeave } from '../src/hunter.js';

describe('findLongWeekends 2026', () => {
  const clusters = findLongWeekends(2026);

  it('menemukan tepat 9 cluster, terurut kronologis', () => {
    assert.equal(clusters.length, 9); // cocok dengan hitungan artikel "9 long weekend 2026"
    for (let i = 1; i < clusters.length; i += 1) {
      assert.ok(clusters[i - 1].start < clusters[i].start);
    }
  });

  it('semua cluster >= 3 hari dan sambung-menyambung hari libur', () => {
    for (const c of clusters) {
      assert.ok(c.totalDays >= 3, `${c.start} hanya ${c.totalDays} hari`);
      assert.ok(c.start <= c.end);
    }
  });

  it('Idul Fitri 18-24 Mar = 7 hari (cluster terpanjang)', () => {
    const fitri = clusters.find((c) => c.start === '2026-03-18');
    assert.ok(fitri);
    assert.equal(fitri.end, '2026-03-24');
    assert.equal(fitri.totalDays, 7);
    assert.equal(fitri.leaveNeeded, 0);
  });

  it('Isra Mikraj 16-18 Jan = 3 hari', () => {
    const c = clusters.find((c) => c.start === '2026-01-16');
    assert.ok(c);
    assert.equal(c.totalDays, 3);
  });

  it('Imlek 14-17 Feb = 4 hari (termasuk cuti bersama 16 Feb)', () => {
    const c = clusters.find((c) => c.start === '2026-02-14');
    assert.ok(c);
    assert.equal(c.totalDays, 4);
    assert.ok(c.redDays.some((h) => h.type === 'cuti-bersama'));
  });

  it('Natal 24-27 Des = 4 hari', () => {
    const c = clusters.find((c) => c.start === '2026-12-24');
    assert.ok(c);
    assert.equal(c.totalDays, 4);
  });

  it('tahun tanpa data -> null', () => {
    assert.equal(findLongWeekends(2030), null);
  });
});

describe('suggestLeave 2026', () => {
  it('cuti 1: strategi terbaik = cuti 17 Mar -> 17-24 Mar = 8 hari', () => {
    const picks = suggestLeave(2026, 1);
    assert.ok(picks.length > 0);
    const best = picks[0];
    assert.equal(best.totalDays, 8);
    assert.equal(best.start, '2026-03-17');
    assert.equal(best.end, '2026-03-24');
    assert.deepEqual(best.leaveDates, ['2026-03-17']);
    assert.equal(best.leaveUsed, 1);
  });

  it('tidak pernah melebihi maxLeave', () => {
    for (const n of [1, 2, 3]) {
      const picks = suggestLeave(2026, n);
      for (const p of picks) {
        assert.ok(p.leaveUsed <= n, `${p.start}: pakai ${p.leaveUsed} > ${n}`);
      }
    }
  });

  it('setiap rekomendasi mengandung >= 1 tanggal merah', () => {
    const picks = suggestLeave(2026, 2);
    for (const p of picks) {
      assert.ok(p.redDays.length >= 1, `${p.start}: tanpa tanggal merah`);
    }
  });

  it('cuti 2: strategi terbaik = cuti 16-17 Mar -> 14-24 Mar = 11 hari', () => {
    const picks = suggestLeave(2026, 2);
    const best = picks[0];
    assert.equal(best.totalDays, 11);
    assert.equal(best.start, '2026-03-14');
    assert.equal(best.end, '2026-03-24');
    assert.deepEqual(best.leaveDates, ['2026-03-16', '2026-03-17']);
  });

  it('hasil terurut: total desc, lalu cuti asc', () => {
    const picks = suggestLeave(2026, 2);
    for (let i = 1; i < picks.length; i += 1) {
      const a = picks[i - 1];
      const b = picks[i];
      assert.ok(
        a.totalDays > b.totalDays || (a.totalDays === b.totalDays && a.leaveUsed <= b.leaveUsed),
        'urutan salah',
      );
    }
  });

  it('tahun tanpa data -> null', () => {
    assert.equal(suggestLeave(2030, 2), null);
  });
});

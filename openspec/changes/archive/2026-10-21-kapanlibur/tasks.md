# Tasks: kapanlibur

## Propose (selesai)
- [x] Riset sumber data (SKB 3 Menteri 2026 via setneg.go.id; api-harilibur 2025)
- [x] Cek nama npm (`libur` terpakai → `kapanlibur` tersedia)
- [x] Tulis proposal.md, spec.md, design.md

## Apply
- [ ] 1. `package.json` (name `kapanlibur`, bin, files, engines, scripts) +
      `.gitignore` + `LICENSE` (MIT)
- [ ] 2. `data/2026.json` — 17 nasional + 8 cuti bersama (terverifikasi SKB)
- [ ] 3. `data/2025.json` — libur nasional dari api-harilibur (+ note jujur)
- [ ] 4. `src/dates.js` — parse/format/addDays/diffDays/isWeekend (anti-timezone-bug)
- [ ] 5. `src/data.js` — load bundel + cache
- [ ] 6. `src/holidays.js` — dayStatus/isHoliday/nextHolidays/getHolidays
- [ ] 7. `src/hunter.js` — findLongWeekends + suggestLeave
- [ ] 8. `src/format.js` — ANSI, formatId, tabel
- [ ] 9. `src/refresh.js` — fetch + validasi + tulis cache
- [ ] 10. `src/commands.js` + `src/cli.js` + `bin/kapanlibur.js`
- [ ] 11. `src/index.js` — public API library
- [ ] 12. Test: `test/dates.test.js`, `test/holidays.test.js`,
      `test/hunter.test.js`, `test/data.test.js`, `test/cli.test.js`
- [ ] 13. `npm test` hijau; coba tiap command manual; `npm pack --dry-run`

## Verify
- [ ] 14. Trace tiap SHALL-01..11 → kode/test
- [ ] 15. Cek arsitektur: tidak ada logic tanggal di cli.js; tidak ada
      `new Date('YYYY-MM-DD')`; file < 300 baris; named exports
- [ ] 16. Install dari tarball (`npm pack` → install lokal) → perintah jalan

## Archive
- [ ] 17. Tulis README.md lengkap
- [ ] 18. Pindahkan openspec change ke `openspec/changes/archive/2026-10-21-kapanlibur/`
- [ ] 19. Scan secret → git init + commit
- [ ] 20. Buat repo `junanda24/daily-kapanlibur` + push + verifikasi API
- [ ] 21. Update `~/workspace/daily-webs/BUILT.md`
- [ ] 22. Update profile README `junanda24/junanda24` (tabel Project harian)
- [ ] 23. Catat ke `~/memory/2026-10-21.md`

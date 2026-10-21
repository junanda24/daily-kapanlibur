# Design: kapanlibur

## Stack
- Node.js ≥ 18, ESM (`"type": "module"`), **zero dependency** (arg parsing
  manual, warna ANSI manual, test pakai `node:test` + `node:assert`).
- `bin/kapanlibur.js` (shebang, executable) → `src/cli.js`.
- Library: `src/index.js` re-export named dari modul logika.

## Struktur (adaptasi ARCHITECTURE.md untuk CLI/library)
Aturan yang dipakai: logic bisnis tidak di handler (di sini: tidak di
parser argv), satu modul satu tanggung jawab, named exports, file < 300 baris.

```
bin/kapanlibur.js   # tipis: shebang + run(process.argv.slice(2))
src/
  index.js          # public API library (named exports)
  cli.js            # parse argv → dispatch ke command (tanpa logic tanggal)
  commands.js       # tiap command: ambil data via modul logic → format → print
  dates.js          # util tanggal murni: parse, formatId, addDays, diffDays,
                    # isWeekend — TANPA tahu soal libur
  data.js           # load data bundel (data/*.json) + cache refresh;
                    # satu-satunya modul yang menyentuh fs untuk data
  holidays.js       # LOGIC BISNIS: dayStatus, isHoliday, nextHolidays
  hunter.js         # LOGIC BISNIS: findLongWeekends, suggestLeave
  format.js         # format terminal: warna ANSI, tabel, header
  refresh.js        # network layer: fetch API publik → validasi → tulis cache
data/2025.json, data/2026.json
test/
  dates.test.js, holidays.test.js, hunter.test.js, cli.test.js, data.test.js
```

Alur data satu arah: `data.js` → `holidays.js`/`hunter.js` → `commands.js` →
`format.js` → stdout. `cli.js` tidak pernah menghitung tanggal.

## Algoritma inti

### Hari libur (dates.js + holidays.js)
- Tanggal direpresentasikan sebagai string `YYYY-MM-DD` + objek `{y,m,d}`.
- **Anti-bug timezone**: parse manual `new Date(y, m-1, d)` (konstruktor lokal),
  bukan `new Date('YYYY-MM-DD')` (di-parse sebagai UTC → bisa geser hari di
  WIB). "Hari ini" dari `new Date()` lokal.
- `dayStatus(dateStr, yearData)` → `'nasional' | 'cuti-bersama' | 'weekend' |
  'kerja'`. Lookup via `Map` tanggal→entri (O(1)).

### Pemburu libur kejepit (hunter.js → findLongWeekends)
- `offSet` = semua tanggal `dayStatus != 'kerja'` dalam setahun.
- Scan kronologis 1 Jan–31 Des: bangun run maksimal tanggal berurutan yang
  semuanya off. Run dengan panjang ≥ 3 = long weekend.
- Tiap cluster: `{ start, end, totalDays, redDays: [...], leaveNeeded: 0 }`.
- Verifikasi manual 2026: 12 run murni terdeteksi (18–24 Mar = 7 hari, dll).

### Optimizer cuti (hunter.js → suggestLeave)
- Untuk tiap tanggal mulai `s` (1 Jan–31 Des) dan panjang jendela `L`
  (4..14 hari): `cost` = jumlah hari kerja (Senin–Jumat, bukan tanggal merah)
  di `[s, s+L-1]`; `total` = L.
- Kandidat valid: cost ≤ maxLeave, cost ≥ 0, jendela mengandung ≥ 1 tanggal
  merah, total ≥ 4. (Batas "mengandung tanggal merah" mencegah rekomendasi
  minggu acak saat maxLeave besar.)
- Ranking: total desc, lalu cost asc, lalu tanggal asc. Deduplikasi jendela
  yang tumpang tindih penuh (ambil yang terbaik per grup overlap).
- Ambil 5 teratas. Tiap hasil: `{ start, end, totalDays, leaveDates: [...],
  leaveUsed, redDays: [...] }`.
- Kompleksitas: 365 × 11 jendela — trivial.

## Format output (format.js)
- Warna ANSI manual (kode `\x1b[...m`), dimatikan bila stdout bukan TTY atau
  `NO_COLOR` diset (hormati konvensi).
- Tanggal Indonesia: `HARI = ['Minggu',...]`, `BULAN = ['Januari',...]`.
- Tabel `list`: kolom tanggal | hari | nama | jenis, padding manual
  (tanpa dependency table).

## Refresh (refresh.js)
- `GET https://api-harilibur.vercel.app/api` (fetch bawaan Node 18+).
- Validasi: array, tiap item punya `holiday_date` (YYYY-M-D atau YYYY-MM-DD)
  dan `holiday_name`. Normalisasi ke format data bundel
  (`type: 'nasional'` bila `is_national_holiday`, selainnya di-skip dengan
  catatan — data regional bukan cuti bersama).
- Simpan ke direktori cache OS (`~/.cache/kapanlibur/` atau
  `%LOCALAPPDATA%`), nama `<tahun>.json`. `data.js` memilih: cache
  (bila ada & tahun cocok) → bundel → error jujur.

## Keputusan penting
- **Tidak pakai commander/chalk**: zero-dep = install instan via
  `npx kapanlibur`, tidak ada supply-chain risk. Parsing argv manual ±40 baris.
- **Data dibundel, bukan selalu-fetch**: CLI harus jalan offline & cepat;
  `refresh` eksplisit untuk update.
- **Cuti bersama ≠ "gratis"**: di output `kejepit`, cluster yang mengandung
  cuti bersama diberi catatan kaki satu baris bahwa cuti bersama memotong
  jatah cuti (aturan SKB untuk ASN; swasta ikut kebijakan perusahaan).

## State buckets (ARCHITECTURE.md §2)
Tidak ada state reaktif — CLI sekali jalan. "State" = argumen (URL bucket
tidak relevan), data tahun (dibaca sekali di `data.js`), cache file
(persistensi eksplisit, bukan store global).

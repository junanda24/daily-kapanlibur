# Spec: kapanlibur

## Perintah CLI

### SHALL-01 — perintah default (tanpa argumen)
WHEN pengguna menjalankan `kapanlibur` tanpa argumen
THEN CLI menampilkan:
- status hari ini (tanggal Indonesia lengkap + salah satu: LIBUR NASIONAL /
  CUTI BERSAMA / AKHIR PEKAN / HARI KERJA),
- tanggal merah berikutnya + hitung mundur hari,
- teaser long weekend terdekat,
- exit code 0.

### SHALL-02 — `next`
WHEN pengguna menjalankan `kapanlibur next [-n JUMLAH]`
THEN CLI menampilkan JUMLAH (default 3) tanggal merah berikutnya
(nasional + cuti bersama), masing-masing: hari, tanggal, nama, jenis,
sisa hari. Exit 0.

### SHALL-03 — `list`
WHEN pengguna menjalankan `kapanlibur list [--year TAHUN]`
THEN CLI menampilkan semua tanggal merah tahun TAHUN (default tahun berjalan)
dalam tabel: tanggal, hari, nama, jenis (NASIONAL/CUTI BERSAMA).
WHEN data tahun itu tidak dibundel
THEN CLI menampilkan pesan jujur "data TAHUN belum tersedia" + saran
`kapanlibur refresh`, exit code 1 (bukan crash, bukan data karangan).

### SHALL-04 — `cek <tanggal>`
WHEN pengguna menjalankan `kapanlibur cek 2026-12-25`
THEN CLI menampilkan status tanggal itu (LIBUR NASIONAL: Hari Raya Natal).
WHEN format tanggal tidak valid
THEN CLI menampilkan contoh format yang benar, exit code 1.
WHEN tanggal valid tapi bukan tanggal merah/weekend
THEN CLI menampilkan "Hari kerja biasa" + tanggal merah terdekat setelahnya.

### SHALL-05 — `kejepit` (pemburu long weekend)
WHEN pengguna menjalankan `kapanlibur kejepit [--year TAHUN]`
THEN CLI menampilkan semua cluster hari-libur-berturut-turut ≥ 3 hari
(Sabtu/Minggu + nasional + cuti bersama), masing-masing: rentang tanggal,
total hari, daftar tanggal merah di dalamnya, dan "modal cuti" (0 bila murni).
Cluster diurut kronologis. Contoh nyata 2026: 18–24 Mar = 7 hari.

### SHALL-06 — `cuti [n]` (optimizer cuti)
WHEN pengguna menjalankan `kapanlibur cuti 2`
THEN CLI menghitung, untuk setiap jendela ≤ 14 hari yang mengandung ≥ 1
tanggal merah, kombinasi ≤ n hari kerja yang bila diambil sebagai cuti
menghasilkan libur beruntun terpanjang; menampilkan 5 teratas: rentang,
total hari libur, tanggal cuti yang harus diambil, efisiensi (hari per cuti).
Contoh nyata 2026: `cuti 1` → ambil cuti Selasa 17 Mar → 17–24 Mar = 8 hari; `cuti 2` → 16–17 Mar → 14–24 Mar = 11 hari.
WHEN n tidak diberikan THEN default 2. WHEN n < 1 atau bukan angka
THEN pesan error + contoh, exit 1.

### SHALL-07 — `refresh`
WHEN pengguna menjalankan `kapanlibur refresh`
THEN CLI mengunduh data dari API publik (tanpa API key), memvalidasi
bentuknya, menyimpannya sebagai cache lokal, dan melaporkan tahun + jumlah
tanggal yang diperbarui + sumbernya.
WHEN network gagal THEN pesan error jujur ("tidak bisa mengunduh"),
data bundel tetap dipakai, exit code 1.

### SHALL-08 — `--help` / `--version`
WHEN pengguna menjalankan `kapanlibur --help` THEN tampil daftar perintah +
contoh, exit 0. WHEN `--version` THEN tampil versi dari package.json, exit 0.

## Library API

### SHALL-09
`require('kapanlibur')` mengekspor named exports:
`getHolidays(year)`, `dayStatus(date)`, `isHoliday(date)`,
`nextHolidays(fromDate, count)`, `findLongWeekends(year)`,
`suggestLeave(year, maxLeaveDays)`. Semua pure function, tanpa I/O
(kecuali `getHolidays` yang membaca data bundel — didokumentasikan).

## Data

### SHALL-10
- `data/2026.json`: 17 libur nasional + 8 cuti bersama sesuai SKB 3 Menteri,
  tiap entri `{ date: 'YYYY-MM-DD', name, type: 'nasional'|'cuti-bersama' }`.
- `data/2025.json`: libur nasional 2025 dari api-harilibur (tanpa cuti bersama;
  dinyatakan di field `note`).
- Tidak ada tanggal duplikat; semua tanggal valid; nama memakai ejaan resmi SKB.

## Kualitas

### SHALL-11
- Zero runtime dependency. Node.js ≥ 18. ESM.
- `npm test` hijau (node:test bawaan).
- Copy Bahasa Indonesia natural, tanpa emoji di output.
- Tanggal diformat Indonesia: "Jumat, 25 Desember 2026".
- Zona waktu: tanggal lokal sistem (tidak ada konversi UTC yang menggeser hari).

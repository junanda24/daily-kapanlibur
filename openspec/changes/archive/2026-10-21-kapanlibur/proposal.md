# Proposal: KapanLibur — CLI "kapan libur?" + pemburu libur kejepit

## Apa
`kapanlibur`: CLI Node.js zero-dependency yang menjawab pertanyaan paling sering
ditanyakan pekerja Indonesia — **"kapan libur?"** — plus dua fitur yang bikin
senyum:

1. **Status hari ini & hitung mundur** ke tanggal merah berikutnya.
2. **Pemburu libur kejepit** (`kapanlibur kejepit`): daftar semua periode libur
   panjang (long weekend) setahun penuh, lengkap dengan "modal cuti"-nya.
3. **Optimizer cuti** (`kapanlibur cuti 2`): "dengan 2 hari cuti, kapan libur
   terpanjang yang bisa kudapat?" — CLI menghitung kombinasi tanggal cuti
   optimal dan tanggal persisnya.

Bonus: bisa dipakai sebagai **library** (`require('kapanlibur')`) —
`isHoliday()`, `findLongWeekends()`, `suggestLeave()`.

## Kenapa ini mengejutkan
Setiap awal tahun, artikel "daftar long weekend 2026" selalu viral dan
dibagikan di grup WhatsApp kantor. Tapi tidak ada yang kepikiran membungkusnya
jadi **perintah terminal** — apalagi yang bisa menghitung *strategi cuti
optimal*. Ini tools yang menyelesaikan ritual tahunan orang Indonesia
("rencanain cuti biar dapet libur panjang") dalam satu baris perintah.
Jawaban atas "kok kepikiran sih": karena yang ditanya bukan cuma *kapan*,
tapi *gimana caranya libur paling panjang dengan cuti paling sedikit*.

## Kenapa bentuk CLI (bukan web app)
- Target pemakainya developer/pekerja kantoran yang hidup di terminal.
- Rotasi program menuntut variasi: 5 hari terakhir = web app, game, npm, Dart,
  game. Slot hari ini = **CLI** (belum pernah dibuat).
- Data kecil & statis (25 tanggal/tahun) → tidak butuh backend, tidak butuh
  login/database. Offline-first.

## Kenapa tanpa backend
Logika 100% komputasi kalender lokal dari data yang dibundel. Satu-satunya
sentuhan network adalah perintah opsional `refresh` yang menarik data terbaru
dari API publik gratis (tanpa API key). Backend = overkill.

## Sumber data (terverifikasi, bukan karangan)
- **2026**: SKB 3 Menteri No. 1497, 2, 5 Tahun 2025 via setneg.go.id —
  17 libur nasional + 8 cuti bersama, diverifikasi tanggal-per-tanggal
  (termasuk hari dalam minggunya) pada 2026-10-21.
- **2025**: API publik api-harilibur.vercel.app (hanya libur nasional;
  cuti bersama 2025 tidak dibundel — dinyatakan jujur di data & CLI).

## Batasan yang disengaja
- Tidak publish ke npm registry sendiri (keputusan di Junan).
- Tidak ada auto-update diam-diam: data tahun baru masuk lewat `refresh`
  eksplisit atau update package.
- Cuti bersama ditandai jelas — bukan "gratis", karena SKB memotong jatah
  cuti tahunan (untuk ASN).

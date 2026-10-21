# KapanLibur

> CLI & library yang menjawab pertanyaan paling sering ditanyakan pekerja Indonesia:
> **"kapan libur?"** — lengkap dengan pemburu libur kejepit dan optimizer cuti.

```sh
$ kapanlibur
KapanLibur
Hari ini: Rabu, 21 Oktober 2026
HARI KERJA

Tanggal merah berikutnya: Cuti Bersama Hari Raya Natal — Kamis, 24 Desember 2026 (64 hari lagi)

$ kapanlibur cuti 2
Strategi cuti 2026: 2 hari cuti → libur terpanjang

1. 14 Mar 2026 – Selasa, 24 Maret 2026 — 11 hari libur
   Ambil cuti: 16 Mar 2026, 17 Mar 2026 (2 hari)
```

**Kenapa ide ini dipilih:** setiap awal tahun, artikel "daftar long weekend"
selalu viral di grup WhatsApp kantor — tapi tidak ada yang kepikiran
membungkusnya jadi perintah terminal, apalagi yang bisa **menghitung strategi
cuti optimal**. KapanLibur menyelesaikan ritual tahunan orang Indonesia
("rencanain cuti biar libur paling panjang") dalam satu baris perintah.
Zero dependency, offline-first, tanpa login/database.

## Fitur

- **Status hari ini** — tanggal merah / cuti bersama / akhir pekan / hari kerja,
  plus hitung mundur ke tanggal merah berikutnya.
- **`next [-n]`** — N tanggal merah berikutnya.
- **`list [--year]`** — semua tanggal merah setahun dalam tabel rapi.
- **`cek YYYY-MM-DD`** — cek status satu tanggal (tanggal fiktif ditolak dengan
  pesan yang jelas; hari kerja biasa diberi tahu tanggal merah terdekat).
- **`kejepit`** — pemburu libur kejepit: semua periode libur beruntun 3+ hari
  setahun penuh (2026: tepat 9 periode, cocok dengan hitungan media).
- **`cuti [n]`** — optimizer cuti: dengan n hari cuti (default 2), tanggal
  persis mana yang diambil untuk libur beruntun terpanjang.
- **`refresh`** — unduh data terbaru dari API publik gratis ke cache lokal.
- **Library** — `require('kapanlibur')` / `import`: `isHoliday`,
  `dayStatus`, `nextHolidays`, `findLongWeekends`, `suggestLeave`, dll.

## Cara pakai (CLI)

Butuh Node.js ≥ 18. Belum dipublish ke npm registry (keputusan pemilik repo),
jadi install langsung dari GitHub:

```sh
npm i -g github:junanda24/daily-kapanlibur
kapanlibur kejepit
```

Atau tanpa install:

```sh
npx github:junanda24/daily-kapanlibur kejepit
```

Perintah:

| Perintah | Contoh | Kegunaan |
|---|---|---|
| `kapanlibur` | — | Status hari ini + tanggal merah berikutnya |
| `kapanlibur next [-n 5]` | `kapanlibur next -n 5` | N tanggal merah berikutnya |
| `kapanlibur list [--year Y]` | `kapanlibur list --year 2026` | Semua tanggal merah setahun |
| `kapanlibur cek YYYY-MM-DD` | `kapanlibur cek 2026-12-25` | Cek satu tanggal |
| `kapanlibur kejepit` | — | Semua libur panjang (3+ hari) |
| `kapanlibur cuti [n]` | `kapanlibur cuti 1` | Strategi cuti optimal |
| `kapanlibur refresh` | — | Unduh data terbaru (cache lokal) |

Warna otomatis mati bila output bukan terminal atau `NO_COLOR` diset.

## Cara pakai (library)

```js
import { prepareYear, isHoliday, findLongWeekends, suggestLeave } from 'kapanlibur';

const doc = prepareYear(2026);
isHoliday('2026-12-25', doc);        // true
findLongWeekends(2026).length;       // 9
suggestLeave(2026, 2)[0];
// { start: '2026-03-14', end: '2026-03-24', totalDays: 11,
//   leaveUsed: 2, leaveDates: ['2026-03-16', '2026-03-17'], ... }
```

## Data

- **2026** (`data/2026.json`): 17 libur nasional + 8 cuti bersama sesuai
  **SKB 3 Menteri No. 1497, 2, 5 Tahun 2025** (diverifikasi tanggal-per-tanggal
  via setneg.go.id pada 2026-10-21).
- **2025** (`data/2025.json`): libur nasional dari API publik
  api-harilibur.vercel.app (cuti bersama 2025 tidak dibundel — dinyatakan
  jujur di file datanya).
- Tahun lain: `kapanlibur refresh` mengunduh dari API publik ke
  `~/.cache/kapanlibur/<tahun>.json` (hanya libur nasional; cuti bersama tidak
  termasuk — dinyatakan di output).

Catatan: cuti bersama **memotong jatah cuti tahunan** (aturan SKB untuk ASN;
swasta mengikuti kebijakan perusahaan) — CLI menampilkannya sebagai catatan
kaki, bukan "hari gratis".

## Mengembangkan dari source

```sh
git clone https://github.com/junanda24/daily-kapanlibur.git
cd daily-kapanlibur
npm test        # 56 test, harus hijau (node:test bawaan, tanpa install)
node bin/kapanlibur.js kejepit
```

Tidak ada `npm install` yang dibutuhkan — zero runtime dependency.

## Tech stack

- Node.js ≥ 18, ESM, **zero dependency** (arg parsing manual, warna ANSI manual)
- Test: `node:test` + `node:assert` bawaan Node
- Data: JSON statis per tahun + cache file untuk `refresh`

## Struktur folder

```
bin/kapanlibur.js   # entry CLI (shebang) — tipis, delegasi ke src/cli.js
src/
  index.js          # public API library (named exports)
  cli.js            # parse argv -> dispatch (tanpa logika tanggal)
  commands.js       # tiap command: logic -> format -> stdout
  holidays.js       # logic bisnis: dayStatus, nextHolidays, ...
  hunter.js         # logic bisnis: findLongWeekends, suggestLeave
  dates.js          # util tanggal murni (anti bug timezone)
  data.js           # load data bundel + cache (satu-satunya modul I/O data)
  format.js         # warna ANSI, tabel, format tanggal Indonesia
  refresh.js        # network layer untuk perintah refresh
data/2025.json data/2026.json
test/               # 56 test (dates, holidays, hunter, cli e2e, library)
openspec/changes/archive/2026-10-21-kapanlibur/  # proposal, spec, design, tasks
```

## Catatan build (2026-10-21)

- **Bug timezone yang nyaris lolos**: `new Date('2026-12-25')` di-parse sebagai
  UTC — di WIB bisa mundur sehari. Semua parsing memakai konstruktor lokal
  `new Date(y, m-1, d)`; ada test khusus "25 Des 2026 = Jumat".
- **Optimizer lebih pintar dari tebakan manual**: perkiraan awal "`cuti 1` →
  29 Mei = 5 hari" ternyata bukan optimum — algoritma menemukan 17 Mar = 8 hari
  (dan `cuti 2` → 16–17 Mar = 11 hari). Spec & test diperbaiki mengikuti
  kebenaran algoritma, bukan sebaliknya.
- **Validasi silang**: `kejepit` menemukan tepat 9 periode libur panjang 2026 —
  cocok dengan hitungan artikel media ("9 long weekend 2026").
- Nama npm `libur` sudah dipakai package lama (2017); `kapanlibur` terverifikasi
  tersedia di registry (belum dipublish — keputusan pemilik).
- API Nager.Date untuk Indonesia tidak lengkap (Idul Fitri dkk. hilang) —
  tidak dipakai. Sumber utama = SKB resmi.

## Rilis

- Tanggal rilis: 2026-10-21
- Repo: https://github.com/junanda24/daily-kapanlibur
- Program: 1 Hari 1 Project (#6)

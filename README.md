# Rekapitulasi Web — Dashboard Klinik

Aplikasi web internal untuk manajemen data pasien dan rekapitulasi kunjungan klinik. Digunakan oleh staf klinik untuk pendaftaran pasien, pencatatan diagnosis, dan pelaporan periodik per poli (Poli Umum & Poli Gigi).

## Tech Stack

| Teknologi | Fungsi |      
|---|---|
| [Next.js 16](https://nextjs.org) | Framework React untuk frontend & routing |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [MUI (Material UI) v7](https://mui.com) | Komponen UI & data grid |
| [TanStack React Query](https://tanstack.com/query) | Client-side data fetching & caching |
| [SWR](https://swr.vercel.app) | Stale-while-revalidate caching |
| [Recharts](https://recharts.org) | Grafik & chart dashboard |
| [Zod](https://zod.dev) | Validasi schema data |
| [Google Apps Script](https://developers.google.com/apps-script) | Backend API (CRUD ke Google Sheets) |
| [Google Sheets](https://sheets.google.com) | Database utama |
| [Vercel](https://vercel.com) | Hosting & deployment |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

## Arsitektur Sistem

```
┌──────────────┐    HTTP Request     ┌─────────────────────┐
│              │ ──────────────────► │  Google Apps Script  │
│   Next.js    │                     │  (Web App - Umum)   │
│   Frontend   │ ◄────────────────── │         │           │
│   (Vercel)   │    JSON Response    │         ▼           │
│              │                     │  Spreadsheet Umum   │
│              │                     └─────────────────────┘
│              │
│              │    HTTP Request     ┌─────────────────────┐
│              │ ──────────────────► │  Google Apps Script  │
│              │                     │  (Web App - Gigi)   │
│              │ ◄────────────────── │         │           │
│              │    JSON Response    │         ▼           │
└──────────────┘                     │  Spreadsheet Gigi   │
                                     └─────────────────────┘
```

Next.js berjalan di Vercel dan berkomunikasi dengan dua Apps Script terpisah melalui HTTP. Masing-masing Apps Script membaca dan menulis data ke spreadsheet Google Sheets yang bersesuaian.

## Fitur Utama

- Pendaftaran pasien (Poli Umum & Poli Gigi)
- CRUD data pasien dengan validasi ICD-10
- Dashboard rekapitulasi kunjungan per periode
- Grafik top diagnosis dan ringkasan rujukan
- Export data ke Excel
- Manajemen user dan profil
- Autentikasi berbasis role (admin/user)

## Struktur Folder

```
src/
├── app/                    # Next.js App Router (halaman & routing)
│   ├── page.tsx            # Halaman login
│   ├── layout.tsx          # Root layout
│   ├── dashboard/          # Halaman dashboard & sub-halaman
│   │   ├── page.tsx        # Dashboard utama (rekapitulasi)
│   │   ├── patients/       # Manajemen data pasien
│   │   ├── poli/           # Halaman per poli
│   │   ├── reports/        # Laporan periodik
│   │   └── users/          # Manajemen user
│   ├── pendaftaran/        # Halaman pendaftaran pasien
│   └── (user)/             # Route group untuk user dashboard
├── components/             # Komponen React
│   ├── Dashboard/          # Komponen khusus dashboard
│   ├── Layout/             # Header, Drawer, DashboardLayout
│   ├── providers/          # React Query provider
│   ├── PatientDataTable    # Tabel data pasien
│   ├── PatientFormDialog   # Form input pasien
│   ├── AuthGuard           # Proteksi route berdasarkan role
│   └── ProfileDialog       # Dialog profil pengguna
├── services/               # API service layer (patientService, userService)
├── hooks/                  # Custom React hooks
├── schemas/                # Zod validation schemas
├── types/                  # TypeScript type definitions
├── lib/                    # Library utilities (auth)
├── utils/                  # Utility functions (date, string, export)
├── data/                   # Static data (ICD-10 codes)
├── theme/                  # MUI theme configuration
└── styles/                 # Global CSS
```

## Prasyarat

Pastikan perangkat Anda sudah terinstal:

- [Node.js](https://nodejs.org) versi 20 atau lebih baru
- [Git](https://git-scm.com)
- Code editor (disarankan [VS Code](https://code.visualstudio.com))

## Setup Development Environment

### 1. Clone Repository

```bash
git clone <repository-url>
cd rekapitulasi-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project dengan variabel berikut:

```env
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=<google-sheets-api-key>
NEXT_PUBLIC_GOOGLE_SHEETS_ID=<google-sheets-id>
NEXT_PUBLIC_GOOGLE_SHEETS_NAME=<nama-sheet>
NEXT_PUBLIC_GOOGLE_SHEETS_RANGE=<range-data>
NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM=<url-apps-script-poli-umum>
NEXT_PUBLIC_GOOGLE_SCRIPT_URL_GIGI=<url-apps-script-poli-gigi>
```

Minta nilai environment variable ini dari developer sebelumnya atau admin project.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Scripts

| Script | Perintah | Fungsi |
|---|---|---|
| `npm run dev` | `next dev` | Jalankan development server |
| `npm run build` | `next build` | Build production bundle |
| `npm run start` | `next start` | Jalankan production server |
| `npm run lint` | `eslint` | Cek kualitas kode |
| `npm run typecheck` | `tsc --noEmit` | Cek error TypeScript |

## CI/CD Pipeline

Project ini menggunakan **GitHub Actions** untuk Continuous Integration dan **Vercel** untuk Continuous Deployment.

### Pipeline Flow

```
Push / Pull Request
       │
       ▼
┌────────────────────┐
│  GitHub Actions CI │
│  1. Lint (ESLint)  │
│  2. Type Check     │
│  3. Build          │
└────────┬───────────┘
         │ Semua ✅
         ▼
┌────────────────────┐
│  Vercel Preview    │  ← URL unik untuk setiap PR
└────────┬───────────┘
         │ Merge ke main
         ▼
┌────────────────────┐
│  Vercel Production │  ← Deploy otomatis
└────────────────────┘
```

### Status Checks

Setiap Pull Request harus melewati 3 checks sebelum bisa di-merge:

1. **Lint** — Memastikan kode mengikuti standar ESLint
2. **Type Check** — Memastikan tidak ada error TypeScript
3. **Build** — Memastikan aplikasi berhasil di-build

## Alur Pengembangan

### Membuat Fitur Baru

```bash
git checkout dev
git pull origin dev
git checkout -b feat/nama-fitur
```

### Commit Convention

Gunakan format **Conventional Commits** agar histori git tetap rapi:

```
feat: tambah filter data pasien berdasarkan poli
fix: perbaiki error pada form pendaftaran
perf: optimasi loading data dashboard
refactor: pindahkan logic validasi ke schema
docs: update README dengan alur CI/CD
```

### Submit Perubahan

```bash
git add .
git commit -m "feat: deskripsi singkat perubahan"
git push origin feat/nama-fitur
```

Kemudian buat **Pull Request** di GitHub:
- Target branch: `dev` (untuk integrasi) atau `main` (untuk production)
- Isi template PR yang sudah disediakan
- Tunggu GitHub Actions selesai (semua checks harus hijau ✅)
- Verifikasi Preview URL dari Vercel
- Merge setelah semua checks pass

### Branch yang Digunakan

| Branch | Tujuan |
|---|---|
| `main` | Branch production, selalu stabil |
| `dev` | Branch integrasi fitur |
| `feat/*` | Branch untuk fitur baru |
| `fix/*` | Branch untuk perbaikan bug |
| `hotfix/*` | Branch untuk fix mendesak ke production |

## Deployment

### Production

Deployment ke production terjadi **otomatis** saat perubahan di-merge ke branch `main`. Vercel akan membangun dan men-deploy aplikasi secara otomatis.

### Preview

Setiap Pull Request yang dibuat akan mendapat **Preview URL** unik dari Vercel. Gunakan URL ini untuk memverifikasi perubahan sebelum merge.

## Komponen Eksternal

### Google Apps Script

Backend API menggunakan dua Google Apps Script yang di-deploy sebagai Web App:

- **Poli Umum** — Menangani CRUD data pasien poli umum
- **Poli Gigi** — Menangani CRUD data pasien poli gigi

Perubahan pada kode Apps Script dilakukan langsung di [Google Apps Script Editor](https://script.google.com). Setelah perubahan, buat deployment baru melalui menu **Deploy → Manage deployments → New deployment**.

### Google Sheets

Data pasien disimpan di Google Sheets yang terpisah untuk masing-masing poli. Setiap spreadsheet memiliki struktur kolom yang konsisten dan diakses melalui Apps Script.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `npm run dev` gagal | Pastikan Node.js versi 20+, jalankan `npm install` ulang |
| Data tidak muncul di dashboard | Periksa env var di `.env.local`, pastikan URL Apps Script benar |
| Build error di CI | Jalankan `npm run typecheck` dan `npm run lint` secara lokal dulu |
| Preview URL Vercel error | Pastikan env var sudah dikonfigurasi di Vercel Dashboard |

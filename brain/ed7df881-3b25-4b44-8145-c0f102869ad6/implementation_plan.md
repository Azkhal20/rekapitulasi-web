# Rencana Optimasi Performa Dashboard & Kecepatan Aplikasi

Dokumen ini merangkum rencana implementasi untuk mengatasi masalah *latency*, LCP yang tinggi (seperti yang dilaporkan: ~100s), dan *lagging* saat navigasi di dalam Dashboard. Solusi difokuskan pada penggabungan caching sisi backend dan perbaikan strategi *data fetching* di frontend.

## User Review Required

> [!IMPORTANT]
> **Persetujuan Diperlukan**: Karena langkah ini merombak cara aplikasi mengambil dan menyimpan data (baik di sisi Google Apps Script maupun Next.js), mohon agar rencana ini disetujui sebelum eksekusi dimulai. Perubahan pada Apps Script membutuhkan Bapak untuk kembali melakukan **New Deployment** secara manual.

## Open Questions

> [!WARNING]
> 1. Apakah *real-time* sangat krusial hingga hitungan detik? Dengan skema Caching, jika Operator A menambahkan data, Operator B mungkin baru akan melihat data tersebut setelah beberapa menit KECUALI Operator B menekan tombol Refresh, atau auto-refresh SWR terpicu. Apakah keterlambatan 1-2 menit untuk pembacaan Dashboard dapat ditoleransi demi kecepatan aplikasi?
> 2. Kita akan menginstal *library* `swr`. Apakah tidak masalah jika saya jalankan perintah instalasi di terminal?

---

## Proposed Changes

Implementasi akan dibagi menjadi 3 fase utama untuk meminimalisir risiko.

### Fase 1: Optimasi Backend (Google Apps Script)
Kita akan menambahkan `CacheService` pada Apps Script. Google Apps Script adalah *bottleneck* utama karena setiap request memicu pembacaan I/O penuh ke Spreadsheet.

#### [MODIFY] `apps-script-poli-umum.gs` & `apps-script-poli-gigi.gs`
- Menambahkan integrasi `CacheService.getScriptCache()`.
- **Pada fungsi `getAllPatientsRaw`**: Sebelum membaca sheet, periksa apakah output JSON untuk sheet tersebut sudah ada di Cache. Jika ada, langsung kembalikan Cache. Jika tidak, proses dari Sheet, lalu simpan ke Cache (TTL: 15-30 menit).
- **Cache Invalidation**: Pada setiap fungsi mutasi (`addPatient`, `updatePatient`, `deletePatient`, `deleteBulkPatients`), cache untuk `sheetName` yang bersangkutan **Wajib Dihapus** (`cache.remove()`) agar memastikan setiap operasi CRUD segera mencerminkan data terbaru.

### Fase 2: Optimasi Frontend (SWR Integration)
Penggunaan *custom* cache pada `PatientService` saat ini berguna, namun kurang reaktif secara UI. Kita akan memigrasi pendekatan *fetching* menggunakan library modern.

#### [NEW] Instalasi Library
- Install package `swr` (Stale-While-Revalidate).

#### [MODIFY] `src/services/patientService.ts`
- Merefaktor agar mendukung struktur tipe data yang dibutuhkan oleh SWR. (Membersihkan *custom caching* karena akan ditangani oleh SWR).

#### [MODIFY] `src/app/dashboard/page.tsx` & Komponen Terkait
- Mengganti `useEffect` dan pemanggilan manual standar dengan `useSWR`.
- **Keuntungan**: Saat pengguna bernavigasi dari halaman `/dashboard` ke `/dashboard/patients`, data akan otomatis terlihat seketika karena dibaca dari *browser cache*, sementara *fetch* berjalan diam-diam di belakang layar.

### Fase 3: Optimasi Rendering (Lazy Loading)
Tampilan Dashboard memuat banyak komponen secara langsung yang berkontribusi pada lamanya waktu LCP (Largest Contentful Paint).

#### [MODIFY] `src/app/dashboard/page.tsx`
- Menggunakan `next/dynamic` dari Next.js untuk membuat *Lazy Load* pada komponen *Charts* (seperti `MonthlyChart`, atau tabel rekap). Ini memastikan halaman dasar dengan struktur UI (*sidebar, header*) termuat sangat cepat terlebih dahulu, sementara grafik menyusul hitungan fraksi detik kemudian.

---

## Verification Plan

### Automated / Unit Checks
- Menjalankan linting (TypeScript `tsc`) untuk memastikan implementasi SWR tidak menimbulkan error *strict-mode*.

### Manual Verification
1. **Kecepatan Awal**: Bapak perlu membuka aplikasi setelah melakukan deployment GAS terbaru. Akses halaman `/dashboard` diproyeksikan akan jauh lebih cepat (seharusnya di bawah 3-5 detik setelah cache GAS terisi).
2. **Navigasi Mulus**: Saat mengklik menu di sidebar, perpindahan halaman harus terjadi tanpa keadaan layar "kosong putih" (*loading* berat).
3. **Data Sync**: Menguji coba tambah data Pasien. Memastikan setelah penambahan, tabel langsung memperbarui datanya (mekanisme hapus-cache berfungsi).

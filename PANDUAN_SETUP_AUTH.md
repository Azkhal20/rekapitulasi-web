# PANDUAN SETUP AUTENTIKASI GOOGLE SHEETS

## LANGKAH 1: Buat Tab "Users" di Google Sheets Poli Umum

1. Buka Google Sheets Poli Umum Anda
2. Klik tanda "+" di bagian bawah untuk menambah Tab baru
3. Rename tab tersebut menjadi: **Users** (huruf besar semua)

## LANGKAH 2: Buat Header Kolom

Di baris pertama Tab "Users", masukkan header berikut:

| USERNAME | PASSWORD | ROLE | NAMA_LENGKAP |
|----------|----------|------|--------------|

**PENTING:** Nama kolom harus PERSIS seperti di atas (huruf besar semua).

## LANGKAH 3: Tambahkan User Pertama (Super Admin)

Sebagai contoh, tambahkan 1 user super admin di baris kedua:

| USERNAME | PASSWORD | ROLE | NAMA_LENGKAP |
|----------|----------|------|--------------|
| admin | admin123 | super_admin | Administrator |

## LANGKAH 4: Update Apps Script

1. Di Google Sheets, klik menu **Extensions** > **Apps Script**
2. Buka file `Code.gs` yang sudah ada
3. **COPY** kode dari file `apps-script-auth.js` yang saya buatkan
4. **PASTE** kode tersebut ke dalam `Code.gs` (gabungkan dengan kode yang sudah ada)
5. Klik **Save** (ikon disket)
6. Klik **Deploy** > **New deployment**
7. Pilih type: **Web app**
8. Execute as: **Me**
9. Who has access: **Anyone**
10. Klik **Deploy**
11. Copy URL yang muncul dan pastikan sudah tersimpan di `.env.local` sebagai `NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM`

## LANGKAH 5: Tes Login

1. Jalankan aplikasi Next.js (`npm run dev`)
2. Buka browser ke `http://localhost:3000`
3. Coba login dengan:
   - Username: `admin`
   - Password: `admin123`
4. Jika berhasil, Anda akan diarahkan ke Dashboard

## LANGKAH 6: Tes Register

1. Klik tab **Register**
2. Isi form:
   - Username: (pilih username baru, misal: `petugas1`)
   - Nama Lengkap: (misal: `Suster Ani`)
   - Password: (misal: `password123`)
   - Role: Pilih dari dropdown (Admin / Viewer / Super Admin)
3. Klik tombol **Register**
4. Jika berhasil, user baru akan otomatis ditambahkan ke Tab "Users" di Google Sheets
5. Coba login dengan username dan password yang baru dibuat

## ROLE & PERMISSION

### Super Admin
- Boleh: Tambah, Edit, Hapus data pasien
- Akses: Semua menu

### Admin / Operator
- Boleh: Tambah, Edit data pasien
- TIDAK Boleh: Hapus data pasien
- Akses: Semua menu

### Viewer
- Boleh: Hanya melihat data
- TIDAK Boleh: Tambah, Edit, Hapus
- Akses: Dashboard & Tabel (Read-Only)

## CATATAN KEAMANAN

⚠️ **PENTING:**
- Password disimpan dalam bentuk **plain text** di Google Sheets
- Untuk keamanan lebih baik, sebaiknya gunakan password yang unik dan tidak sama dengan password penting lainnya
- Jangan share link Google Sheets ke orang yang tidak berwenang
- Untuk produksi, pertimbangkan menggunakan enkripsi password (hash)

## TROUBLESHOOTING

### Error: "Tab 'Users' tidak ditemukan"
- Pastikan nama tab persis **Users** (huruf besar semua)
- Refresh halaman Google Sheets

### Error: "Format tabel Users salah"
- Pastikan header kolom persis: USERNAME, PASSWORD, ROLE, NAMA_LENGKAP
- Tidak ada spasi tambahan

### Login gagal terus
- Cek apakah username dan password di Sheet persis sama (case-sensitive)
- Pastikan tidak ada spasi di awal/akhir username atau password

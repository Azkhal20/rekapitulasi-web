# Setup CRUD dengan Google Sheets

## Langkah-langkah Setup

### 1. Deploy Google Apps Script

1. Buka Google Sheets Anda
2. Klik **Extensions** > **Apps Script**
3. Copy code dari Apps Script yang telah Anda berikan
4. Klik **Deploy** > **New deployment**
5. Pilih type: **Web app**
6. Set "Execute as": **Me**
7. Set "Who has access": **Anyone** (atau sesuai kebutuhan)
8. Klik **Deploy**
9. Copy **Web app URL** yang diberikan

### 2. Konfigurasi Environment Variable

Buat file `.env.local` di root project dengan isi:

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Ganti `YOUR_DEPLOYMENT_ID` dengan URL deployment Anda dari langkah 1.

### 3. Fitur yang Tersedia

#### Tambah Pasien
- Klik button **"TAMBAH PASIEN"**
- Isi form yang muncul
- Data otomatis terisi: Tanggal, Tahun, Bulan, Hari
- Klik **"Tambah Pasien"** untuk menyimpan

#### Edit Pasien
- Klik icon **Edit (pensil)** di kolom AKSI pada baris yang ingin diedit
- Form akan muncul dengan data yang sudah terisi
- Ubah data yang diperlukan
- Klik **"Simpan Perubahan"**

#### Hapus Pasien
- Klik icon **Delete (tempat sampah)** di kolom AKSI pada baris yang ingin dihapus
- Konfirmasi penghapusan
- Data akan terhapus dari tabel dan Google Sheets

### 4. Struktur Data

Data yang dikirim ke Google Sheets sesuai dengan field berikut:
- TANGGAL
- TAHUN
- BULAN
- HARI
- ENAM_BELAS_LIMA_BELAS (kolom "16-15")
- L
- P
- NAMA
- USIA
- NIP
- OBS_TTV
- KELUHAN
- DIAGNOSIS
- ICD10
- TINDAKAN
- OBAT

### 5. Catatan Penting

- **Sinkronisasi Real-time**: Setiap operasi CRUD langsung tersinkronisasi dengan Google Sheets
- **Row ID**: Untuk operasi Edit dan Delete, sistem menggunakan nomor baris di Google Sheets sebagai ID
- **Error Handling**: Jika operasi gagal, akan muncul notifikasi error
- **Success Notification**: Setiap operasi yang berhasil akan menampilkan notifikasi sukses

### 6. Troubleshooting

**Problem**: Data tidak tersimpan ke Google Sheets
- **Solution**: Pastikan URL Google Apps Script sudah benar di `.env.local`
- **Solution**: Pastikan Apps Script sudah di-deploy dengan akses yang benar

**Problem**: Error CORS
- **Solution**: Pastikan Apps Script deployment setting "Who has access" sudah sesuai

**Problem**: Data tidak refresh otomatis setelah tambah/edit/hapus
- **Solution**: Pastikan prop `onDataChange` sudah di-pass ke component `PatientDataTable`

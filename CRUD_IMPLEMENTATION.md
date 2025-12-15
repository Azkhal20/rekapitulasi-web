# Implementasi CRUD - Dashboard Pasien

## 📋 Overview

Implementasi ini menambahkan fitur **CRUD (Create, Read, Update, Delete)** lengkap pada dashboard pasien yang terintegrasi langsung dengan **Google Sheets**. Semua operasi akan otomatis tersinkronisasi dengan spreadsheet Anda.

## 🎯 Fitur yang Ditambahkan

### 1. **Create (Tambah Pasien)**
- Button "TAMBAH PASIEN" di kanan atas tabel
- Form dialog dengan validasi
- Auto-fill tanggal, tahun, bulan, dan hari
- Data langsung ditambahkan ke Google Sheets

### 2. **Read (Lihat Data)**
- Tabel dengan pagination
- Search & filter
- Sort by column
- Data real-time dari Google Sheets

### 3. **Update (Edit Pasien)**
- Button Edit (icon pensil) di kolom AKSI
- Form pre-filled dengan data existing
- Update langsung ke Google Sheets

### 4. **Delete (Hapus Pasien)**
- Button Delete (icon tempat sampah) di kolom AKSI
- Konfirmasi dialog sebelum hapus
- Hapus langsung dari Google Sheets

## 📁 File yang Dibuat/Dimodifikasi

### File Baru:

1. **`src/services/patientService.ts`**
   - Service untuk integrasi dengan Google Apps Script
   - Functions: `getAllPatients()`, `getPatientById()`, `addPatient()`, `updatePatient()`, `deletePatient()`

2. **`src/components/PatientFormDialog.tsx`**
   - Form dialog untuk tambah/edit pasien
   - Validasi input
   - Auto-fill tanggal
   - Support mode "add" dan "edit"

3. **`CRUD_SETUP.md`**
   - Dokumentasi setup dan troubleshooting
   - Langkah-langkah deployment Apps Script

### File yang Dimodifikasi:

1. **`src/components/PatientDataTable.tsx`**
   - Tambah kolom "AKSI" dengan button Edit & Delete
   - Integrasi dengan PatientFormDialog
   - Delete confirmation dialog
   - Snackbar notifications
   - Props `onDataChange` untuk refresh data

2. **`src/app/dashboard/patients/page.tsx`**
   - Callback `handleDataChange()` untuk refresh tabel
   - Pass callback ke PatientDataTable component

## 🔧 Setup & Deployment

### Langkah 1: Deploy Google Apps Script

1. Buka Google Sheets Anda
2. Klik **Extensions** → **Apps Script**
3. Copy paste code Apps Script yang Anda berikan
4. Klik **Deploy** → **New deployment**
5. Pilih:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (atau sesuai kebutuhan)
6. Klik **Deploy**
7. **Copy URL deployment**

### Langkah 2: Konfigurasi Environment Variable

Buat file **`.env.local`** di root project:

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

⚠️ **Penting**: Ganti `YOUR_DEPLOYMENT_ID` dengan URL deployment Anda!

### Langkah 3: Restart Development Server

```bash
npm run dev
```

## 🎨 UI/UX Features

### Form Dialog
- **Header**: Background ungu (#696CFF) dengan title yang jelas
- **Auto-fill**: Tanggal otomatis terisi saat tambah pasien baru
- **Validasi**: Field-field penting ditandai required
- **Loading State**: Button disabled dengan spinner saat submit
- **Error Handling**: Alert merah jika ada error

### Action Buttons
- **Edit**: Icon pensil biru (#696CFF)
  - Hover effect dengan background transparan
  - Tooltip "Edit"
  
- **Delete**: Icon tempat sampah merah (#FF4C51)
  - Hover effect dengan background transparan
  - Tooltip "Hapus"

### Notifications (Snackbar)
- **Success**: Green alert saat operasi berhasil
- **Error**: Red alert saat operasi gagal
- **Position**: Bottom-right
- **Auto-hide**: 4 detik

### Delete Confirmation
- Dialog konfirmasi dengan nama pasien
- Warning: Data tidak dapat dikembalikan
- Button merah untuk konfirmasi hapus

## 🔄 Alur Data

### Tambah Pasien
```
User Click "TAMBAH PASIEN"
  ↓
Form Dialog Muncul (auto-fill tanggal)
  ↓
User Isi Form & Submit
  ↓
POST ke Google Apps Script (?action=add)
  ↓
Data Ditambahkan ke Google Sheets
  ↓
Success Notification
  ↓
Tabel Auto-Refresh
```

### Edit Pasien
```
User Click Icon Edit
  ↓
Fetch Data Pasien (convert to PatientData format)
  ↓
Form Dialog Muncul (pre-filled)
  ↓
User Edit Data & Submit
  ↓
POST ke Google Apps Script (?action=update)
  ↓
Data Diupdate di Google Sheets (by row ID)
  ↓
Success Notification
  ↓
Tabel Auto-Refresh
```

### Hapus Pasien
```
User Click Icon Delete
  ↓
Confirmation Dialog Muncul
  ↓
User Konfirmasi
  ↓
POST ke Google Apps Script (?action=delete)
  ↓
Row Dihapus dari Google Sheets
  ↓
Success Notification
  ↓
Tabel Auto-Refresh
```

## 📊 Mapping Data

Data dikirim ke Google Sheets dengan struktur:

| Form Field | Google Sheets Column | Google Apps Script Key |
|------------|---------------------|------------------------|
| Tanggal | A | TANGGAL |
| Tahun | B | TAHUN |
| Bulan | C | BULAN |
| Hari | D | HARI |
| 16-15 | E | ENAM_BELAS_LIMA_BELAS |
| L | F | L |
| P | G | P |
| Nama | H | NAMA |
| Usia | I | USIA |
| NIP | J | NIP |
| Obs TTV | K | OBS_TTV |
| Keluhan | L | KELUHAN |
| Diagnosis | M | DIAGNOSIS |
| ICD10 | N | ICD10 |
| Tindakan | O | TINDAKAN |
| Obat | P | OBAT |

## 🐛 Troubleshooting

### Problem: Data tidak tersimpan ke Google Sheets

**Solusi:**
1. Pastikan URL di `.env.local` sudah benar
2. Pastikan Apps Script sudah di-deploy
3. Check console browser untuk error
4. Pastikan sheet name di Apps Script = "POLI UMUM"

### Problem: Error CORS

**Solusi:**
- Apps Script deployment harus set "Who has access": Anyone
- Restart development server setelah update `.env.local`

### Problem: Data tidak auto-refresh

**Solusi:**
- Pastikan `onDataChange` prop sudah di-pass ke `PatientDataTable`
- Check fungsi `handleDataChange()` di page component

### Problem: Button Edit/Delete tidak muncul

**Solusi:**
- Pastikan data memiliki field `id`
- Check struktur data dari Google Sheets

### Problem: Form tidak auto-fill tanggal

**Solusi:**
- Check browser console untuk error
- Pastikan locale "id-ID" support untuk `toLocaleDateString()`

## 🔐 Security Notes

⚠️ **Important Security Considerations:**

1. **Apps Script URL**: Jangan commit `.env.local` ke Git
2. **Access Control**: Set Apps Script access sesuai kebutuhan
3. **Data Validation**: Form memiliki validasi client-side, tambahkan validasi server-side di Apps Script jika diperlukan
4. **API Rate Limits**: Google Apps Script memiliki quota limits, pantau usage Anda

## 📝 Catatan Pengembangan

### Row ID untuk Edit/Delete
- Sistem menggunakan **row number** di Google Sheets sebagai ID
- Row 1 = header, data dimulai dari row 2
- Saat delete, row akan dihapus dan row number berubah
- Pastikan data selalu ter-sync dengan benar

### Error Handling
- Semua async operations di-wrap dengan try-catch
- Error di-log ke console untuk debugging
- User-friendly error messages di snackbar
- Form dialog menampilkan error jika submit gagal

### Performance
- Data loading menggunakan loading state
- CRUD operations menampilkan loading indicator
- Debounce dapat ditambahkan untuk search jika data besar

## 🚀 Future Enhancements

Beberapa improvement yang bisa ditambahkan:

1. **Batch Operations**: Select multiple rows untuk delete
2. **Export Data**: Download tabel sebagai Excel/PDF
3. **Advanced Filters**: Filter by date range, multiple columns
4. **Audit Log**: Track who created/updated/deleted what
5. **Offline Support**: Queue operations saat offline
6. **Real-time Sync**: WebSocket untuk auto-refresh saat data berubah
7. **Image Upload**: Support upload foto pasien ke Google Drive

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check `CRUD_SETUP.md` untuk troubleshooting
2. Check browser console untuk error details
3. Verify Google Apps Script logs
4. Test Apps Script endpoints langsung via browser

---

**Created**: December 11, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

# 🚨 TROUBLESHOOTING: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## ❌ Masalah
Error ini muncul ketika:
- Klik "TAMBAH PASIEN" → Error
- Klik Edit (icon pensil) → Error  
- Klik Delete (icon tempat sampah) → Error

## ✅ Penyebab
Response dari server adalah **HTML** bukan **JSON**. Ini terjadi karena:

1. ❌ **Google Apps Script URL belum dikonfigurasi** di `.env.local`
2. ❌ **Google Apps Script belum di-deploy** sebagai Web App
3. ❌ **Deployment URL salah** atau tidak valid

## 🔧 SOLUSI LENGKAP

### Step 1️⃣: Deploy Google Apps Script

#### A. Buka Google Apps Script Editor
1. Buka Google Sheets Anda
2. Klik menu **Extensions** → **Apps Script**
3. Akan terbuka tab baru dengan Apps Script Editor

#### B. Paste Code Apps Script
Pastikan code berikut sudah ada di editor:

```javascript
// === KONFIGURASI ===
const SHEET_NAME = "POLI UMUM"; // Target sheet
const SHEET = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);

// === ROUTING ===
function doGet(e) {
  const action = e.parameter.action;

  if (action === "getAll") return getAll();
  if (action === "getById") return getById(e);

  return jsonResponse({ error: "Invalid GET request" });
}

function doPost(e) {
  const action = e.parameter.action;
  const body = JSON.parse(e.postData.contents);

  if (action === "add") return addPatient(body);
  if (action === "update") return updatePatient(body);
  if (action === "delete") return deletePatient(body);

  return jsonResponse({ error: "Invalid POST request" });
}

// === GET ALL DATA ===
function getAll() {
  const data = SHEET.getDataRange().getValues();
  const headers = data.shift(); // remove header row

  const result = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  return jsonResponse(result);
}

// === GET BY ROW ===
function getById(e) {
  const id = Number(e.parameter.id); // row number
  const data = SHEET.getDataRange().getValues();
  const headers = data.shift();

  if (id < 2 || id > data.length + 1) {
    return jsonResponse({ error: "Data not found" });
  }

  const rowData = SHEET.getRange(id, 1, 1, headers.length).getValues()[0];

  let result = {};
  headers.forEach((h, i) => (result[h] = rowData[i]));

  return jsonResponse(result);
}

// === CREATE DATA PASIEN ===
function addPatient(body) {
  const row = [
    body.TANGGAL,
    body.TAHUN,
    body.BULAN,
    body.HARI,
    body.ENAM_BELAS_LIMA_BELAS, // mapping untuk kolom "16-15"
    body.L,
    body.P,
    body.NAMA,
    body.USIA,
    body.NIP,
    body.OBS_TTV,
    body.KELUHAN,
    body.DIAGNOSIS,
    body.ICD10,
    body.TINDAKAN,
    body.OBAT,
  ];

  SHEET.appendRow(row);

  return jsonResponse({ message: "Added successfully" });
}

// === UPDATE ===
function updatePatient(body) {
  const id = Number(body.id);

  const row = [
    body.TANGGAL,
    body.TAHUN,
    body.BULAN,
    body.HARI,
    body.ENAM_BELAS_LIMA_BELAS,
    body.L,
    body.P,
    body.NAMA,
    body.USIA,
    body.NIP,
    body.OBS_TTV,
    body.KELUHAN,
    body.DIAGNOSIS,
    body.ICD10,
    body.TINDAKAN,
    body.OBAT,
  ];

  SHEET.getRange(id, 1, 1, row.length).setValues([row]);

  return jsonResponse({ message: "Updated successfully" });
}

// === DELETE ===
function deletePatient(body) {
  const id = Number(body.id);

  SHEET.deleteRow(id);

  return jsonResponse({ message: "Deleted successfully" });
}

// === JSON WRAPPER ===
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

#### C. Deploy sebagai Web App
1. Klik button **Deploy** (di kanan atas) → **New deployment**
2. Di sebelah "Select type", klik icon ⚙️ → pilih **Web app**
3. Isi konfigurasi:
   - **Description**: `Patient CRUD API` (atau terserah)
   - **Execute as**: **Me** (email Anda)
   - **Who has access**: **Anyone**
4. Klik **Deploy**
5. Akan muncul dialog "Authorization required" → Klik **Authorize access**
6. Pilih akun Google Anda
7. Klik **Advanced** (kiri bawah)
8. Klik **Go to [Project Name] (unsafe)**
9. Klik **Allow**
10. **COPY URL** yang muncul! Format: `https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXX/exec`

### Step 2️⃣: Update .env.local

Buka file `.env.local` di root project Anda dan **tambahkan baris ini**:

```bash
# Google Apps Script untuk CRUD
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXX/exec
```

⚠️ **PENTING**: 
- Ganti `AKfycbxXXXXXXXXXXXXX` dengan ID deployment Anda!
- URL harus panjang dan berakhir dengan `/exec`
- Jangan ada spasi atau tanda kutip ekstra

**Contoh .env.local lengkap:**

```bash
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyDgvTEbmB-QKP86S1LESmyliXY2eS2Eqpg
NEXT_PUBLIC_GOOGLE_SHEETS_ID=19bts5NBKNvvRsMhzPrEin6n9wqomUwn7B1fHwqM55nE
NEXT_PUBLIC_GOOGLE_SHEETS_NAME="POLI UMUM"
NEXT_PUBLIC_GOOGLE_SHEETS_RANGE=A1:Z1000

# Google Apps Script untuk CRUD
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXX/exec
```

### Step 3️⃣: Restart Development Server

1. **Stop** server yang sedang berjalan (tekan `Ctrl+C` di terminal)
2. **Start** lagi:
   ```bash
   npm run dev
   ```
3. Tunggu sampai muncul ` ✓ Ready in ...`
4. Buka browser: `http://localhost:3000`

### Step 4️⃣: Test CRUD

1. Buka `/dashboard/patients`
2. Klik **"TAMBAH PASIEN"** → Isi form → Submit
3. Jika berhasil:
   - ✅ Muncul notifikasi hijau "Data pasien berhasil ditambahkan"
   - ✅ Data muncul di tabel
   - ✅ Data juga masuk ke Google Sheets

## 🧪 Test Manual Apps Script

Jika masih error, test URL secara manual:

1. Copy URL Apps Script Anda
2. Tambahkan `?action=getAll` di belakang
3. Buka di browser tab baru
4. Harusnya muncul JSON data pasien

**Contoh:**
```
https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXX/exec?action=getAll
```

**Expected result (JSON):**
```json
[
  {
    "TANGGAL": "2025-12-11",
    "TAHUN": "2025",
    "BULAN": "December",
    ...
  }
]
```

Jika muncul **HTML error page**, berarti deployment belum benar!

## 🔍 Jika Masih Error

### Error: "Google Apps Script URL belum dikonfigurasi"
✅ **Solusi**: Pastikan sudah tambahkan `NEXT_PUBLIC_GOOGLE_SCRIPT_URL` di `.env.local`

### Error: "HTML error" atau "Authorization required"
✅ **Solusi**: 
1. Re-deploy Apps Script
2. Pastikan "Who has access" = **Anyone**
3. Authorize dengan akun Google Anda

### Error: "Invalid JSON response"
✅ **Solusi**: 
1. Check Apps Script code sudah benar
2. Pastikan ada fungsi `jsonResponse()`
3. Test manual URL di browser

### Data tidak masuk ke Google Sheets
✅ **Solusi**:
1. Check nama sheet di Apps Script = `"POLI UMUM"`
2. Pastikan header column sudah sesuai
3. Check console browser untuk error detail

## 📞 Command untuk Debug

Lihat URL yang dikonfigurasi:
```bash
cat .env.local | grep GOOGLE_SCRIPT_URL
```

Test koneksi (di browser console):
```javascript
fetch('YOUR_APPS_SCRIPT_URL?action=getAll')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

## ✅ Checklist Setup

- [ ] Apps Script code sudah di-paste
- [ ] Apps Script sudah di-deploy sebagai Web app
- [ ] "Who has access" = Anyone
- [ ] URL deployment sudah di-copy
- [ ] URL sudah ditambahkan ke `.env.local`
- [ ] Development server sudah di-restart
- [ ] Test manual URL di browser → dapat JSON
- [ ] Test tambah data → berhasil
- [ ] Test edit data → berhasil
- [ ] Test delete data → berhasil

---

**Jika sudah mengikuti semua step di atas dan masih error, screenshot error message lengkap dan share untuk troubleshooting lebih lanjut!**

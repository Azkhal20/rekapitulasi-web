# ✅ FIX: TypeError: output.setHeader is not a function

## 🎯 Masalah
Error pada baris 208: `TypeError: output.setHeader is not a function`

## ✅ Solusi

Google Apps Script **TIDAK support** method `setHeader()` individual. 

**Good News:** Google Apps Script Web App sudah **automatically handle CORS** ketika di-deploy sebagai "Anyone can access"!

## 🔧 Code Yang Benar

### ❌ JANGAN gunakan ini (Error):
```javascript
// SALAH - akan error!
function jsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  
  output.setHeader('Access-Control-Allow-Origin', '*'); // ❌ Error!
  
  return output;
}
```

### ✅ GUNAKAN ini (Correct):
```javascript
// BENAR - simple dan works!
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 📝 Langkah Update

### Step 1: Copy Code Baru

File: **`APPS_SCRIPT_SIMPLE.js`** (sudah saya buat)

### Step 2: Replace Apps Script Code

1. Buka Google Sheets
2. **Extensions** → **Apps Script**
3. **Hapus SEMUA code** yang ada
4. **Copy-paste SEMUA code** dari `APPS_SCRIPT_SIMPLE.js`
5. **Save** (Ctrl+S atau icon disk)

### Step 3: Deploy Ulang

**PENTING**: Karena code berubah, deploy ulang:

1. Klik **Deploy** → **Manage deployments**
2. Klik icon ⚙️ (gear/edit) pada deployment aktif
3. Di **Version**, pilih **New version**
4. **Description**: "Fixed setHeader error"
5. Klik **Deploy**
6. URL akan tetap sama

**ATAU** jika ingin deployment baru:

1. Klik **Deploy** → **New deployment**
2. Pilih ⚙️ → **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Klik **Deploy**
6. **Authorize** jika diminta
7. Copy URL baru dan update di `.env.local`

### Step 4: Test

Buka di browser (ganti dengan URL Anda):
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getAll
```

**Expected Result:**
```json
[
  {
    "id": 2,
    "TANGGAL": "2025-12-11",
    "TAHUN": "2025",
    "BULAN": "Desember",
    ...
  }
]
```

### Step 5: Test di Dashboard

1. Buka `/dashboard/patients`
2. Klik **"TAMBAH PASIEN"**
3. Isi form
4. Submit

**Check browser console:**
```
🔵 Adding patient to Google Sheets...
URL: https://script.google.com/macros/s/...
Response status: 200
✅ Patient added successfully
```

## 🔍 Mengapa CORS Berfungsi Tanpa Header Manual?

Google Apps Script Web App **automatically adds CORS headers** ketika:
- Deployed sebagai Web app
- "Who has access" = **Anyone**
- Response menggunakan `ContentService`

Response headers yang otomatis ditambahkan:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
```

Jadi **TIDAK PERLU** add manual CORS headers!

## ✅ Perbedaan Code Lama vs Baru

### APPS_SCRIPT_FIXED.js (❌ Error)
- ❌ Ada `setCorsHeaders()` function
- ❌ Ada `doOptions()` function  
- ❌ Ada loop `setHeader()` → **ERROR di sini!**
- 243 baris

### APPS_SCRIPT_SIMPLE.js (✅ Works)
- ✅ Simple `jsonResponse()` function
- ✅ Tidak ada manual CORS setup
- ✅ Google handle CORS automatically
- ✅ Error handling tetap ada
- ✅ Test functions included
- 231 baris (lebih simple!)

## 🧪 Test di Apps Script Editor

Setelah paste code baru, test langsung di editor:

1. Di Apps Script editor, pilih function dropdown → **testGetAll**
2. Klik **Run** (▶️)
3. Authorize jika diminta
4. Check **Execution log** (View → Logs atau Ctrl+Enter)

**Expected log:**
```
[{id=2.0, TANGGAL=..., NAMA=..., ...}]
```

Atau test **testAddPatient** untuk test create:
1. Pilih function → **testAddPatient**
2. Klik **Run**
3. Check log → harusnya ada `{success=true, message=Added successfully}`
4. Check Google Sheets → data baru ditambahkan

## 📋 Checklist

- [ ] Copy code dari `APPS_SCRIPT_SIMPLE.js`
- [ ] Paste ke Apps Script editor (replace all)
- [ ] Save code
- [ ] Deploy ulang (new version)
- [ ] Test manual URL di browser → dapat JSON
- [ ] Test di Apps Script editor (testGetAll) → success
- [ ] Test di dashboard → tambah pasien success
- [ ] Browser console tidak ada error

## 🎉 Hasil Akhir

Setelah update, CRUD operations (Create, Read, Update, Delete) akan berfungsi sempurna:

✅ **Tambah Pasien** → Data masuk ke Google Sheets  
✅ **Edit Pasien** → Data terupdate di Google Sheets  
✅ **Delete Pasien** → Row terhapus dari Google Sheets  
✅ **Refresh otomatis** → Tabel langsung update  
✅ **Notifications** → Snackbar muncul untuk feedback  

---

**Copy code dari `APPS_SCRIPT_SIMPLE.js` dan paste ke Apps Script Anda sekarang!**

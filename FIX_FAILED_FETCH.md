# 🚨 Fix "Failed to Fetch" Error

## ⚡ QUICK FIX

### Step 1: Update Apps Script Code

1. Buka Google Sheets → **Extensions** → **Apps Script**
2. **Ganti SEMUA code** dengan code dari file `APPS_SCRIPT_FIXED.js`
3. **Save** (Ctrl+S)
4. Klik **Deploy** → **Manage deployments**
5. Klik icon ⚙️ (edit) pada deployment yang aktif
6. Pilih **New version** → Klik **Deploy**
7. **Copy** URL yang baru (atau sama seperti sebelumnya)

### Step 2: Verify .env.local

Pastikan file `.env.local` berisi:

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyUQCUiYBjr-OQMCnbtzbcNgfOLEIFHzDiS5Utvj06pLFrXWlhtGMvNlfb4C4X8KwZq/exec
```

### Step 3: Test Manual

Buka di browser:
```
https://script.google.com/macros/s/AKfycbyUQCUiYBjr-OQMCnbtzbcNgfOLEIFHzDiS5Utvj06pLFrXWlhtGMvNlfb4C4X8KwZq/exec?action=getAll
```

**Expected**: JSON data pasien
**Jika error**: Ada masalah di Apps Script deployment

### Step 4: Check Browser Console

Setelah update code di atas, coba tambah/edit pasien lagi.

Buka **Browser Console** (F12) dan lihat log:

**Normal (Success):**
```
🔵 Adding patient to Google Sheets...
URL: https://script.google.com/...
Data: {...}
Response status: 200
✅ Patient added successfully
```

**Error:**
```
❌ Error adding patient: Failed to fetch
```

## 🔍 Penyebab "Failed to Fetch"

### 1. ❌ CORS Issue
**Gejala**: Request blocked di browser
**Solusi**: Update Apps Script dengan code baru yang sudah include CORS headers

### 2. ❌ Apps Script Not Deployed Properly
**Gejala**: URL tidak bisa diakses atau error 404
**Solusi**: 
- Re-deploy Apps Script
- Pastikan "Who has access" = **Anyone**
- Generate new version

### 3. ❌ Network/Firewall Blocking
**Gejala**: Timeout atau connection refused
**Solusi**: 
- Check internet connection
- Disable VPN/proxy
- Try different network

### 4. ❌ Apps Script Execution Time
**Gejala**: Timeout setelah 30 detik
**Solusi**: 
- Optimasi Apps Script code
- Reduce data size

## 🧪 Test di Apps Script Editor

Untuk memastikan Apps Script berfungsi:

1. Di Apps Script editor, pilih function **testAddPatient**
2. Klik **Run**
3. Check **Execution log** (Ctrl+Enter)
4. Harusnya ada log JSON response

## 📊 Perubahan di Apps Script Baru

### ✅ Added CORS Headers
```javascript
function setCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
```

### ✅ Better Error Handling
- Try-catch di semua functions
- Detailed error messages
- Validation for ID

### ✅ Improved JSON Response
- Include success flag
- Include data in response
- Better error format

### ✅ Add doOptions for Preflight
```javascript
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeaders(setCorsHeaders());
}
```

## 🔧 Advanced Debugging

### Check Request di Network Tab

1. Buka DevTools (F12)
2. Tab **Network**
3. Coba tambah/edit pasien
4. Lihat request ke Google Apps Script

**Status Code:**
- `200 OK` → Success
- `0` → CORS issue atau network error
- `401/403` → Authorization error
- `404` → URL tidak ditemukan
- `500` → Error di Apps Script

### Test dengan cURL

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec?action=add" \
  -H "Content-Type: application/json" \
  -d '{
    "TANGGAL": "2025-12-11",
    "TAHUN": "2025",
    "BULAN": "Desember",
    "HARI": "Rabu",
    "NAMA": "Test Patient",
    "USIA": "30",
    "KELUHAN": "Test",
    "DIAGNOSIS": "Test"
  }'
```

## ✅ Checklist

- [ ] Apps Script code sudah diupdate dengan APPS_SCRIPT_FIXED.js
- [ ] Apps Script sudah di-redeploy (new version)
- [ ] Test manual URL di browser → dapat JSON
- [ ] .env.local sudah benar
- [ ] Dev server sudah di-restart
- [ ] Browser console menunjukkan log dengan emoji 🔵
- [ ] Network tab menunjukkan request ke Apps Script
- [ ] Status code 200
- [ ] Response adalah JSON bukan HTML

## 🆘 Jika Masih Gagal

1. Screenshot **full error** di console
2. Screenshot **Network tab** untuk request ke Apps Script
3. Screenshot **Apps Script deployment settings**
4. Copy paste **full error message**

---

**TIP**: Setelah update Apps Script, tunggu 1-2 menit sebelum test lagi karena Google needs time to propagate deployment.

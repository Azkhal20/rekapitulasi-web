# 🚨 QUICK FIX: Failed to Fetch (Setelah Deploy Baru)

## ✅ Apps Script Works (testGetAll Berhasil)
## ❌ Frontend Gagal Connect (Failed to Fetch)

## 🎯 ROOT CAUSE

Development server masih menggunakan environment variable LAMA. Ketika Apps Script di-redeploy, Next.js dev server perlu **RESTART** untuk load ulang environment variables dan clear cache.

---

## ✅ SOLUSI LENGKAP (IKUTI STEP BY STEP)

### **Step 1: STOP Development Server** ⚠️ WAJIB!

Di terminal yang running `npm run dev`:
1. Tekan **Ctrl+C**
2. Tunggu sampai muncul: `^C` dan server stop
3. Pastikan benar-benar stop (tidak ada proses running)

### **Step 2: Clear Next.js Cache**

Di terminal yang sama:
```bash
rm -rf .next
```

Atau di Windows PowerShell:
```powershell
Remove-Item -Recurse -Force .next
```

### **Step 3: START Development Server**

```bash
npm run dev
```

Tunggu sampai muncul:
```
✓ Ready in ...
○ Local: http://localhost:3000
```

### **Step 4: Clear Browser Cache**

**Chrome/Edge:**
1. Tekan **Ctrl+Shift+Delete**
2. Pilih "Cached images and files"
3. Time range: **Last hour**
4. Click **Clear data**

**Atau** hard reload:
- Tekan **Ctrl+Shift+R** (Windows)
- Atau **Cmd+Shift+R** (Mac)

### **Step 5: Test dengan HTML Test Page** 🧪

Saya sudah buat test page standalone untuk test Apps Script connection:

1. Buka file **`test-apps-script.html`** di browser
   - Double click file
   - Atau drag & drop ke browser
2. URL Apps Script sudah pre-filled
3. Klik **"▶️ Test GET All Patients"**

**Expected Result:**
```
✅ SUCCESS!

Status: 200
Data count: X patients
```

**Jika GAGAL:**
```
❌ FAILED!

Error: Failed to fetch

Possible causes:
- Apps Script not deployed
- URL incorrect
- Network/CORS issue
```

### **Step 6: Test di Dashboard**

1. Buka **`http://localhost:3000/dashboard/patients`**
2. **Hard reload** page (Ctrl+Shift+R)
3. Buka **Console** (F12)
4. Klik **"TAMBAH PASIEN"**
5. Isi form minimal
6. Submit

**Check Console Output:**

**✅ Success:**
```
🔵 Adding patient to Google Sheets...
URL: https://script.google.com/macros/s/...
Data: {...}
Response status: 200
Response headers: {...}
✅ Patient added successfully: {success: true, ...}
```

**❌ Failed:**
```
❌ Error adding patient: Failed to fetch
```

---

## 🔍 DEBUGGING CHECKLIST

Jika masih "Failed to fetch" setelah restart:

### ✅ Check 1: Environment Variable Loaded?

Di console browser, test:
```javascript
// Paste di console
console.log('URL:', process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL)
```

**Expected:** URL lengkap Apps Script
**Jika undefined:** Server belum load .env.local

### ✅ Check 2: URL Correct?

Test manual di browser tab baru:
```
https://script.google.com/macros/s/AKfycbyUQCUiYBjr-OQMCnbtzbcNgfOLEIFHzDiS5Utvj06pLFrXWlhtGMvNlfb4C4X8KwZq/exec?action=getAll
```

**Expected:** JSON data
**Jika HTML error page:** Deployment issue

### ✅ Check 3: Network Tab

1. Open DevTools (F12)
2. Tab **Network**
3. Try add patient
4. Look for request to `script.google.com`

**Status Code:**
- `200` = Success ✅
- `0` or `(failed)` = CORS/Network issue ❌
- `404` = URL not found ❌
- `403` = Permission denied ❌

### ✅ Check 4: Console Errors

Any errors besides "Failed to fetch"?
- CORS error?
- Mixed content (http/https)?
- CSP violation?

---

## 🆘 COMMON ISSUES

### Issue 1: "Failed to fetch" Persists

**Try:**
```bash
# Full clean restart
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### Issue 2: Environment Variable Not Loading

**Check .env.local:**
```bash
cat .env.local | grep GOOGLE_SCRIPT_URL
```

**Should show:**
```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/...
```

**NO quotes around URL!**
**Must start with `NEXT_PUBLIC_`!**

### Issue 3: CORS Still Blocking

**In Apps Script:**
1. Re-check deployment settings
2. "Who has access" = **Anyone**
3. Try create **NEW deployment** (not update existing)

### Issue 4: Works in HTML Test but Not Dashboard

**Browser extension blocking?**
- Disable ad blockers
- Disable privacy extensions
- Try incognito mode

---

## ✅ FINAL CHECKLIST

Before asking for more help, confirm:

- [ ] Apps Script testGetAll works in editor
- [ ] Manual URL test in browser returns JSON
- [ ] .env.local has NEXT_PUBLIC_GOOGLE_SCRIPT_URL
- [ ] Dev server STOPPED completely
- [ ] .next folder DELETED
- [ ] Dev server STARTED fresh
- [ ] Browser cache CLEARED
- [ ] Hard reload page (Ctrl+Shift+R)
- [ ] HTML test page works
- [ ] Console shows 🔵 log when trying CRUD
- [ ] Network tab shows request to script.google.com

---

## 📝 NOTES

**Why restart is必要:**

Next.js caches environment variables at **build time** and **server start time**. When you:
1. Deploy new Apps Script
2. Update .env.local
3. But don't restart server

The server still uses **cached values** and might have:
- Stale connections
- Old fetch configurations
- Cached responses

**Restart ensures:**
- ✅ Fresh environment variables
- ✅ Clear cache
- ✅ New connections
- ✅ Latest code

---

**RESTART DEV SERVER NOW!** 

Then test dengan `test-apps-script.html` untuk confirm Apps Script accessible from browser.

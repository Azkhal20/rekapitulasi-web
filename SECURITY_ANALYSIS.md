# Analisis Keamanan Rekapitulasi Web

Dokumen ini berisi analisis keamanan untuk sistem autentikasi dan saran perbaikan.

## 1. Keamanan Saat Ini (Login Page & Apps Script)

### Apa Apakah Mudah "Dibobol"?
Secara default, aplikasi ini menggunakan Google Sheets sebagai backend database. Berikut adalah analisisnya:

*   **Jalur Komunikasi (HTTPS):**
    *   ✅ **Aman**. Koneksi dari web app (Next.js) ke Google Apps Script selalu menggunakan HTTPS (enkripsi SSL/TLS oleh Google). Ini berarti data username dan password yang dikirim dari browser ke server *tidak bisa* diintip oleh orang di jaringan wifi yang sama (Man-in-the-Middle attack).
    
*   **Brute Force Attack (Tebak Password):**
    *   ⚠️ **Risiko Sedang**. Apps Script memiliki kuota eksekusi harian dan rate limit internal dari Google. Jika seseorang mencoba menebak password ribuan kali dengan cepat, Google akan memblokir script tersebut sementara karena "Too many requests". Ini memberikan perlindungan alami terhadap brute force yang agresif, namun tidak spesifik per user.

*   **Penyimpanan Password:**
    *   ❌ **Tidak Aman (Plain Text)**. Saat ini password disimpan apa adanya di Google Sheets. Jika seseorang (misal admin lain atau hacker) mendapatkan akses "Editor" ke Google Sheets tersebut, mereka bisa membaca semua password user.

*   **Akses Dashboard:**
    *   ✅ **Cukup Aman**. Dashboard dilindungi oleh `AuthGuard`. Jika seseorang mencoba masuk ke `/dashboard` tanpa login, mereka akan ditendang keluar. Namun, keamanan ini bergantung pada browser (client-side). Jika seseorang memiliki token akses (localStorage), mereka bisa masuk. Karena token disimpan di LocalStorage, ini rentan terhadap XSS (Cross-Site Scripting) jika ada celah di tempat lain, tapi Next.js cukup aman dari XSS secara default.

## 2. Apakah Gambar Login Bisa "Diserang"?
Jika maksud Anda adalah serangan terhadap integritas visual atau phishing:
*   Karena aplikasi di-serve secara lokal atau statis, risiko defacement kecil kecuali server hostingnya yang kena hack.
*   Gambar background dan UI tidak memiliki celah keamanan spesifik (seperti SVG injection) karena menggunakan komponen standar Material UI dan gambar statis.

## 3. Rekomendasi Perbaikan (Best Practice)

Agar sistem lebih "Battle-Hardened" dan sulit dibobol, berikut saran yang bisa diterapkan:

### A. Hashing Password (Client-Side)
Karena Apps Script terbatas kemampuan kriptografinya, Anda bisa melakukan hashing di sisi Client (Browser) sebelum dikirim.
*   **Cara:** Gunakan library crypto-js di frontend.
*   **Alur:** Browser meng-hash password (misal SHA-256) -> Kirim Hash ke Apps Script -> Apps Script membandingkan Hash.
*   **Keuntungan:** Google Sheets hanya menyimpan Hash. Jika sheet bocor, password asli user tetap aman.

### B. Two-Factor Authentication (2FA) - Opsional
Untuk role "Super Admin", bisa ditambahkan verifikasi kode sederhana yang dikirim ke email (menggunakan `MailApp` di Apps Script), meskipun ini akan menambah kompleksitas.

### C. Ganti URL Apps Script Secara Berkala
Jika URL Web App Apps Script bocor ke publik, orang iseng bisa mengirim spam request. Solusinya adalah me-redeploy script untuk mendapat URL baru jika dirasa ada aktivitas mencurigakan.

### D. Batasi Akses Sheet
Pastikan Google Sheet "Database" hanya dishare ke akun Google milik developer/admin utama saja. Jangan set "Anyone with the link can edit".

---

**Kesimpulan:**
Untuk penggunaan skala kecil/internal kantor, keamanan saat ini **cukup** asalkan:
1.  Password user dibuat kuat (kombinasi huruf/angka).
2.  Akses ke file Google Spreadsheet dijaga ketat.
3.  Perangkat yang digunakan untuk login bebas dari malware/keylogger.

Jika ingin upgrade keamanan, prioritas utama adalah **Hashing Password**.

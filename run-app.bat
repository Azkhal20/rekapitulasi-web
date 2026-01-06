@echo off
TITLE Rekapitulasi Web Service
echo ========================================================
echo   MEMULAI WEBSITE REKAPITULASI (LOKAL & PORTABLE)
echo ========================================================
echo.

:: --- 1. SETTING MODE PORTABLE ---
if exist "bin\node.exe" goto :PORTABLE_MODE
goto :SYSTEM_MODE

:PORTABLE_MODE
echo [MODE] PORTABLE DETECTED. Menggunakan Node.js lokal...
set "PATH=%CD%\bin;%PATH%"
goto :CHECK_NODE

:SYSTEM_MODE
echo [MODE] SYSTEM. Mencoba mencari Node.js di sistem Windows...
goto :CHECK_NODE

:CHECK_NODE
:: Cek apakah Node.js benar-benar ada
node -v >nul 2>&1
if %errorlevel% neq 0 goto :NODE_NOT_FOUND

echo [INFO] Node.js ditemukan.
echo.

:: --- 2. CEK & INSTALL DEPENDENSI ---
if not exist "node_modules\" goto :INSTALL_DEPS
goto :BUILD_APP

:INSTALL_DEPS
echo [INFO] Mendeteksi instalasi pertama. Menginstall paket...
echo        Mohon tunggu, ini butuh koneksi internet...
call npm install
if %errorlevel% neq 0 goto :INSTALL_FAIL
goto :BUILD_APP

:BUILD_APP
:: --- 3. BANGUN APLIKASI (BUILD) ---
echo [INFO] Menyiapkan aplikasi (Building)...
echo        (Langkah ini mungkin lebih lama untuk pertama kali)
call npm run build
if %errorlevel% neq 0 goto :BUILD_FAIL

:: --- 4. START SERVER ---
:: Buka browser otomatis setelah 5 detik
timeout /t 5 >nul
start http://localhost:3000

echo.
echo [INFO] Website siap! 
echo        JANGAN TUTUP JENDELA INI agar website tetap jalan.
echo.
call npm run start
pause
exit

:NODE_NOT_FOUND
echo.
echo [ERROR] Node.js TIDAK DITEMUKAN!
echo.
echo SOLUSI:
echo 1. Download "node.exe" (Versi LTS).
echo 2. Pastikan file "node.exe" ada di dalam folder "bin".
echo.
pause
exit

:INSTALL_FAIL
echo.
echo [ERROR] Gagal menginstall paket (npm install failed).
echo Cek koneksi internet Anda lalu coba lagi.
echo.
pause
exit

:BUILD_FAIL
echo.
echo [ERROR] Gagal membangun aplikasi (Build Failed).
echo Cek kodingan apakah ada error.
echo.
pause
exit

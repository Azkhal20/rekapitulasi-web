// ============================================
// APPS SCRIPT UNTUK AUTENTIKASI (TAB USERS)
// ============================================
// Tambahkan kode ini ke Apps Script yang sudah ada di Google Sheets Poli Umum

// Fungsi untuk handle Login
function handleLogin(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  
  if (!sheet) {
    return {
      success: false,
      message: "Tab 'Users' tidak ditemukan. Silakan buat tab Users terlebih dahulu."
    };
  }
  
  const username = data.username;
  const password = data.password;
  
  // Ambil semua data dari sheet Users
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Cek header (baris pertama)
  const headers = values[0];
  const usernameCol = headers.indexOf("USERNAME");
  const passwordCol = headers.indexOf("PASSWORD");
  const roleCol = headers.indexOf("ROLE");
  const fullNameCol = headers.indexOf("NAMA_LENGKAP");
  
  if (usernameCol === -1 || passwordCol === -1) {
    return {
      success: false,
      message: "Format tabel Users salah. Pastikan ada kolom USERNAME dan PASSWORD."
    };
  }
  
  // Cari user yang cocok (mulai dari baris 2, skip header)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    
    if (row[usernameCol] === username && row[passwordCol] === password) {
      // Login berhasil
      return {
        success: true,
        message: "Login berhasil",
        user: {
          USERNAME: row[usernameCol],
          PASSWORD: row[passwordCol],
          ROLE: row[roleCol] || "admin",
          NAMA_LENGKAP: row[fullNameCol] || username
        }
      };
    }
  }
  
  // Jika tidak ditemukan
  return {
    success: false,
    message: "Username atau password salah"
  };
}

// Fungsi untuk handle Register
function handleRegister(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  
  if (!sheet) {
    return {
      success: false,
      message: "Tab 'Users' tidak ditemukan. Silakan buat tab Users terlebih dahulu."
    };
  }
  
  const username = data.username;
  const password = data.password;
  const role = data.role || "admin";
  const fullName = data.fullName || username;
  
  // Validasi
  if (!username || !password) {
    return {
      success: false,
      message: "Username dan password wajib diisi"
    };
  }
  
  // Cek apakah username sudah ada
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const usernameCol = headers.indexOf("USERNAME");
  
  if (usernameCol === -1) {
    return {
      success: false,
      message: "Format tabel Users salah. Pastikan ada kolom USERNAME."
    };
  }
  
  // Cek duplikasi username
  for (let i = 1; i < values.length; i++) {
    if (values[i][usernameCol] === username) {
      return {
        success: false,
        message: "Username sudah digunakan. Silakan pilih username lain."
      };
    }
  }
  
  // Tambahkan user baru
  const newRow = [username, password, role, fullName];
  sheet.appendRow(newRow);
  
  return {
    success: true,
    message: "Registrasi berhasil. Silakan login."
  };
}

// ============================================
// UPDATE FUNGSI doPost() YANG SUDAH ADA
// ============================================
// Tambahkan case 'login' dan 'register' di dalam fungsi doPost() yang sudah ada

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = e.parameter.action;
    
    // ... kode existing untuk action 'add', 'update', 'delete' ...
    
    // TAMBAHKAN INI:
    if (action === 'login') {
      const result = handleLogin(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'register') {
      const result = handleRegister(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... kode existing lainnya ...
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

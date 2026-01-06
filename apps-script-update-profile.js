/**
 * TAMBAHAN FUNGSI UNTUK APPS SCRIPT (Update Versi 2 - Support Ganti Username)
 * 
 * 1. Tambahkan pengecekan ini di dalam fungsi doPost(e), di bagian "HANDLE AUTHENTICATION ACTIONS":
 * 
 *    if (action === 'updateProfile') {
 *      const result = handleUpdateProfile(data);
 *      return successResponse(result);
 *    }
 *    
 *    if (action === 'updatePassword') {
 *      const result = handleUpdatePassword(data);
 *      return successResponse(result);
 *    }
 * 
 * 2. HAPUS fungsi handleUpdateProfile yang lama, dan GANTI dengan yang baru di bawah ini:
 */

// --- PROFILE UPDATE FUNCTIONS ---

function handleUpdateProfile(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab Users tidak ditemukan" };
  
  const currentUsername = data.username; // Username lama user yang sedang login
  const newFullName = data.fullName;
  const newUsername = data.newUsername; // Username baru (opsional, jika diedit)
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const usernameCol = headers.indexOf("USERNAME");
  const fullNameCol = headers.indexOf("NAMA_LENGKAP");
  
  if (usernameCol === -1) return { success: false, message: "Kolom USERNAME tidak ditemukan" };
  
  // 1. Cek apakah newUsername sudah dipakai orang lain (jika ada request ganti username)
  if (newUsername && newUsername !== currentUsername) {
    for (let i = 1; i < values.length; i++) {
        // Lewati baris user itu sendiri (nanti kita cek lagi pas update, tapi ini cek duplikat global)
        // Sebenarnya loop update di bawah sudah cukup aman, tapi validasi di awal lebih baik.
        if (values[i][usernameCol] === newUsername) {
            return { success: false, message: "Username baru sudah digunakan orang lain" };
        }
    }
  }
  
  // 2. Cari User dan Update Data
  for (let i = 1; i < values.length; i++) {
    if (values[i][usernameCol] === currentUsername) {
      
      // Update Nama Lengkap
      if (newFullName) {
         sheet.getRange(i + 1, fullNameCol + 1).setValue(newFullName);
      }
      
      // Update Username (jika ada request ganti)
      if (newUsername && newUsername !== currentUsername) {
         sheet.getRange(i + 1, usernameCol + 1).setValue(newUsername);
      }
      
      return { success: true, message: "Profil berhasil diperbarui" };
    }
  }
  
  return { success: false, message: "User tidak ditemukan" };
}

function handleUpdatePassword(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab Users tidak ditemukan" };
  
  const username = data.username;
  const oldPassword = data.oldPassword;
  const newPassword = data.newPassword;
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const usernameCol = headers.indexOf("USERNAME");
  const passwordCol = headers.indexOf("PASSWORD");
  
  if (usernameCol === -1 || passwordCol === -1) return { success: false, message: "Kolom USERNAME/PASSWORD tidak ditemukan" };
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][usernameCol] === username) {
      // Cek password lama
      if (values[i][passwordCol] !== oldPassword) {
        return { success: false, message: "Password lama salah" };
      }
      
      // Update password baru
      sheet.getRange(i + 1, passwordCol + 1).setValue(newPassword);
      return { success: true, message: "Password berhasil diperbarui" };
    }
  }
  
  return { success: false, message: "User tidak ditemukan" };
}

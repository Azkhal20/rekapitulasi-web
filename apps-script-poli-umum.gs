/**
 * REKAPITULASI WEB - APPS SCRIPT POLI UMUM V8 (FINAL)
 * Fitur: Auth (Login/Register) + CRUD + Bulk Delete Pasien + User Management (Super Admin)
 * Total Kolom: 28 (A-AB)
 */

const COLUMN_MAPPING = [
  "TANGGAL",
  "TAHUN",
  "BULAN",
  "HARI",
  "16-15",
  "L",
  "P",
  "BARU",
  "LAMA",
  "NAMA",
  "USIA",
  "NIP",
  "OBS TTV",
  "KELUHAN",
  "DIAGNOSIS",
  "ICD-10",
  "TINDAKAN",
  "OBAT",
  "RUJUK_FASKES_PERTAMA_PB",
  "RUJUK_FASKES_PERTAMA_PL",
  "RUJUK_FKRTL_PB",
  "RUJUK_FKRTL_PL",
  "PTM_RUJUK_FKRTL_PB",
  "PTM_RUJUK_FKRTL_PL",
  "DIRUJUK_BALIK_PUSKESMAS_PB",
  "DIRUJUK_BALIK_PUSKESMAS_PL",
  "DIRUJUK_BALIK_FKRTL_PB",
  "DIRUJUK_BALIK_FKRTL_PL",
];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const action = e.parameter.action;
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        return errorResponse("Invalid JSON format");
      }
    }

    // AUTHENTICATION
    if (action === "login") return successResponse(handleLogin(data));
    if (action === "register") return successResponse(handleRegister(data));
    if (action === "updateProfile")
      return successResponse(handleUpdateProfile(data));
    if (action === "updatePassword")
      return successResponse(handleUpdatePassword(data));

    // USER MANAGEMENT (SUPER ADMIN)
    if (action === "getUsers") return successResponse(getAllUsers());
    if (action === "saveUser") return successResponse(saveUser(data)); // Handles Add & Update
    if (action === "deleteUser") return successResponse(deleteUser(data));

    return handleRequest(e);
  } catch (error) {
    return errorResponse(error.toString());
  } finally {
    lock.releaseLock();
  }
}

function handleRequest(e) {
  try {
    const action = e.parameter.action;
    let sheetName = e.parameter.sheetName || "JANUARI 2026";

    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
        if (body.sheetName) sheetName = body.sheetName;
      } catch (err) {}
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet)
      return errorResponse("Sheet '" + sheetName + "' tidak ditemukan.");

    if (action === "getAll") return getAllPatients(sheet);
    if (action === "add") return addPatient(sheet, body);
    if (action === "update") return updatePatient(sheet, body);
    if (action === "delete") return deletePatient(sheet, body);
    if (action === "deleteBulk") return deleteBulkPatients(sheet, body);

    return getAllPatients(sheet);
  } catch (err) {
    return errorResponse(err.toString());
  }
}

// PATIENT CRUD
function getAllPatients(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return successResponse([]);
  const dataRange = sheet.getRange(3, 1, lastRow - 2, 28);
  const displayValues = dataRange.getDisplayValues();
  const result = displayValues.map((row, i) => {
    let obj = { id: i + 3 };
    COLUMN_MAPPING.forEach((key, index) => {
      obj[key] = row[index] || "";
    });
    return obj;
  });
  return successResponse(result);
}

function addPatient(sheet, data) {
  const newRow = COLUMN_MAPPING.map((key) => data[key] || "");
  sheet.appendRow(newRow);
  return successResponse({
    message: "Data berhasil ditambahkan",
    id: sheet.getLastRow(),
  });
}

function updatePatient(sheet, data) {
  const id = parseInt(data.id);
  COLUMN_MAPPING.forEach((key, i) => {
    if (data[key] !== undefined) sheet.getRange(id, i + 1).setValue(data[key]);
  });
  return successResponse({ message: "Data berhasil diperbarui" });
}

function deletePatient(sheet, data) {
  const id = parseInt(data.id);
  if (id >= 3) sheet.deleteRow(id);
  return successResponse({ message: "Data berhasil dihapus" });
}

function deleteBulkPatients(sheet, data) {
  const ids = data.ids;
  if (!ids || !Array.isArray(ids)) return errorResponse("Invalid IDs");
  ids
    .sort((a, b) => b - a)
    .forEach((id) => {
      if (parseInt(id) >= 3) sheet.deleteRow(parseInt(id));
    });
  return successResponse({ message: ids.length + " data berhasil dihapus" });
}

// AUTH FUNCTIONS
function handleLogin(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab 'USERS' tidak ditemukan" };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, message: "Data pengguna kosong" };
  const values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = values[0];
  const uCol = headers.indexOf("USERNAME"),
    pCol = headers.indexOf("PASSWORD"),
    rCol = headers.indexOf("ROLE"),
    nCol = headers.indexOf("NAMA_LENGKAP");
  for (let i = 1; i < values.length; i++) {
    if (
      values[i][uCol] === data.username &&
      values[i][pCol] === data.password
    ) {
      return {
        success: true,
        user: {
          USERNAME: values[i][uCol],
          ROLE: values[i][rCol],
          NAMA_LENGKAP: values[i][nCol],
        },
      };
    }
  }
  return { success: false, message: "Username atau password salah" };
}

function handleRegister(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab 'USERS' tidak ditemukan" };
  sheet.appendRow([
    data.username,
    data.password,
    data.role || "admin",
    data.fullName || data.username,
  ]);
  return { success: true, message: "Registrasi berhasil" };
}

function handleUpdateProfile(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  const values = sheet.getDataRange().getValues();
  const uCol = values[0].indexOf("USERNAME"),
    nCol = values[0].indexOf("NAMA_LENGKAP");
  for (let i = 1; i < values.length; i++) {
    if (values[i][uCol] === data.username) {
      sheet.getRange(i + 1, nCol + 1).setValue(data.fullName);
      return { success: true };
    }
  }
}

function handleUpdatePassword(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  const values = sheet.getDataRange().getValues();
  const uCol = values[0].indexOf("USERNAME"),
    pCol = values[0].indexOf("PASSWORD");
  for (let i = 1; i < values.length; i++) {
    if (
      values[i][uCol] === data.username &&
      values[i][pCol] === data.oldPassword
    ) {
      sheet.getRange(i + 1, pCol + 1).setValue(data.newPassword);
      return { success: true };
    }
  }
  return { success: false, message: "Password lama salah" };
}

// USER MANAGEMENT FUNCTIONS
function getAllUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = data[0];
  const uCol = headers.indexOf("USERNAME");
  const pCol = headers.indexOf("PASSWORD");
  const rCol = headers.indexOf("ROLE");
  const nCol = headers.indexOf("NAMA_LENGKAP");

  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      id: i + 1,
      username: data[i][uCol],
      password: data[i][pCol],
      role: data[i][rCol],
      fullName: data[i][nCol],
    });
  }
  return users;
}

function saveUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab Users missing" };

  if (data.id) {
    // Update
    const row = parseInt(data.id);
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const uCol = headers.indexOf("USERNAME") + 1;
    const pCol = headers.indexOf("PASSWORD") + 1;
    const rCol = headers.indexOf("ROLE") + 1;
    const nCol = headers.indexOf("NAMA_LENGKAP") + 1;

    if (data.username) sheet.getRange(row, uCol).setValue(data.username);
    if (data.password) sheet.getRange(row, pCol).setValue(data.password);
    if (data.role) sheet.getRange(row, rCol).setValue(data.role);
    if (data.fullName) sheet.getRange(row, nCol).setValue(data.fullName);
    return { success: true, message: "User updated" };
  } else {
    // Add New
    const users = sheet.getDataRange().getValues();
    const uIndex = users[0].indexOf("USERNAME");
    for (let i = 1; i < users.length; i++) {
      if (users[i][uIndex] === data.username) {
        return { success: false, message: "Username already exists" };
      }
    }
    sheet.appendRow([data.username, data.password, data.role, data.fullName]);
    return { success: true, message: "User added" };
  }
}

function deleteUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false };
  if (data.id) {
    sheet.deleteRow(parseInt(data.id));
    return { success: true, message: "User deleted" };
  }
  return { success: false, message: "Invalid ID" };
}

function successResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function errorResponse(message) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ error: message }),
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

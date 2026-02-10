/**
 * REKAPITULASI WEB - APPS SCRIPT POLI UMUM V8 (FINAL)
 * Fitur: CRUD + Bulk Delete Pasien
 */

// COLUMN MAPPING: Urutan harus sesuai dengan kolom A-AB di Google Sheets
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

    // Auth Actions
    if (action === "login") return successResponse(handleLogin(data));
    if (action === "register") return successResponse(handleRegister(data));
    if (action === "updateProfile")
      return successResponse(handleUpdateProfile(data));
    if (action === "updatePassword")
      return successResponse(handleUpdatePassword(data));

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
    const DEFAULT_SHEET = "JANUARI 2026";
    let sheetName = e.parameter.sheetName || DEFAULT_SHEET;

    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
        if (body.sheetName) sheetName = body.sheetName;
      } catch (err) {}
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return errorResponse("Sheet '" + sheetName + "' tidak ditemukan.");
    }

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

// CRUD FUNCTIONS
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
    if (data[key] !== undefined) {
      sheet.getRange(id, i + 1).setValue(data[key]);
    }
  });
  return successResponse({ message: "Data berhasil diperbarui" });
}

function deletePatient(sheet, data) {
  const id = parseInt(data.id);
  sheet.deleteRow(id);
  return successResponse({ message: "Data berhasil dihapus" });
}

function deleteBulkPatients(sheet, data) {
  const ids = data.ids;
  if (!ids || !Array.isArray(ids)) return errorResponse("Invalid IDs");
  ids.sort((a, b) => b - a);
  ids.forEach((id) => {
    const rowIdx = parseInt(id);
    if (rowIdx >= 3) sheet.deleteRow(rowIdx);
  });
  return successResponse({ message: ids.length + " data berhasil dihapus" });
}

// AUTH FUNCTIONS (Users Sheet Required)
function handleLogin(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet)
    return { success: false, message: "Tab 'Users' tidak ditemukan." };
  const username = data.username;
  const password = data.password;
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const usernameCol = headers.indexOf("USERNAME");
  const passwordCol = headers.indexOf("PASSWORD");
  const roleCol = headers.indexOf("ROLE");
  const fullNameCol = headers.indexOf("NAMA_LENGKAP");

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[usernameCol] === username && row[passwordCol] === password) {
      return {
        success: true,
        user: {
          USERNAME: row[usernameCol],
          ROLE: row[roleCol],
          NAMA_LENGKAP: row[fullNameCol],
        },
      };
    }
  }
  return { success: false, message: "Username atau password salah" };
}

function handleRegister(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab 'Users' tidak ditemukan" };
  const newRow = [
    data.username,
    data.password,
    data.role || "admin",
    data.fullName || data.username,
  ];
  sheet.appendRow(newRow);
  return { success: true, message: "Registrasi berhasil" };
}

function handleUpdateProfile(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const values = sheet.getDataRange().getValues();
  const usernameCol = values[0].indexOf("USERNAME");
  const nameCol = values[0].indexOf("NAMA_LENGKAP");
  for (let i = 1; i < values.length; i++) {
    if (values[i][usernameCol] === data.username) {
      sheet.getRange(i + 1, nameCol + 1).setValue(data.fullName);
      return { success: true };
    }
  }
}

function handleUpdatePassword(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const values = sheet.getDataRange().getValues();
  const usernameCol = values[0].indexOf("USERNAME");
  const passCol = values[0].indexOf("PASSWORD");
  for (let i = 1; i < values.length; i++) {
    if (
      values[i][usernameCol] === data.username &&
      values[i][passCol] === data.oldPassword
    ) {
      sheet.getRange(i + 1, passCol + 1).setValue(data.newPassword);
      return { success: true };
    }
  }
  return { success: false, message: "Password lama salah" };
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

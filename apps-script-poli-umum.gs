/**
 * REKAPITULASI WEB - APPS SCRIPT POLI UMUM V9 (WITH CACHE)
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

const CACHE_TTL = 900; // 15 menit dalam detik

// Helper: simpan ke cache dengan chunking (limit GAS 100KB per item)
function saveToCache(cache, key, data) {
  try {
    const json = JSON.stringify(data);
    const chunkSize = 90000;
    if (json.length <= chunkSize) {
      cache.put(key, json, CACHE_TTL);
      cache.put(key + "_chunks", "1", CACHE_TTL);
    } else {
      const chunks = [];
      for (let i = 0; i < json.length; i += chunkSize) {
        chunks.push(json.substring(i, i + chunkSize));
      }
      chunks.forEach((chunk, i) => cache.put(key + "_c" + i, chunk, CACHE_TTL));
      cache.put(key + "_chunks", String(chunks.length), CACHE_TTL);
    }
  } catch (e) {
    console.log("Cache save error:" + e);
  }
}

// Helper: baca dari cache (handle chunking)
function getFromCache(cache, key) {
  try {
    const chunkCount = cache.get(key + "_chunks");
    if (!chunkCount) return null;
    const count = parseInt(chunkCount);
    if (count === 1) {
      const data = cache.get(key);
      return data ? JSON.parse(data) : null;
    }
    let json = "";
    for (let i = 0; i < count; i++) {
      const chunk = cache.get(key + "_c" + i);
      if (!chunk) return null;
      json += chunk;
    }
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Helper: hapus cache sheet tertentu (dipanggil setelah mutasi data)
function invalidateCache(cache, sheetName) {
  try {
    const key = "umum_" + sheetName;
    cache.remove(key + "_chunks");
    for (let i = 0; i < 20; i++) cache.remove(key + "_c" + i);
    cache.remove(key);
  } catch (e) {}
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const action = e.parameter.action;
    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {}
    }

    const data = { ...e.parameter, ...payload };

    // 1. Auth & Profiles (Independent of Sheets)
    if (action === "login") return successResponse(handleLogin(data));
    if (action === "register") return successResponse(handleRegister(data));
    if (action === "getUsers") return successResponse(getAllUsers());
    if (action === "saveUser") return successResponse(saveUser(data));
    if (action === "deleteUser") return successResponse(deleteUser(data));
    if (action === "updateProfile") return successResponse(handleUpdateProfile(data));
    if (action === "updatePassword") return successResponse(handleUpdatePassword(data));

    // 2. Patient Data CRUD (Requires Sheet)
    let sheetName = data.sheetName || "JANUARI 2026";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) return errorResponse("Sheet '" + sheetName + "' tidak ditemukan.");

    if (action === "getAll") return getAllPatients(sheet, sheetName);
    if (action === "getAllYear") return getAllYear(data.year || "2026");
    if (action === "add") return addPatient(sheet, data, sheetName);
    if (action === "update") return updatePatient(sheet, data, sheetName);
    if (action === "delete") return deletePatient(sheet, data, sheetName);
    if (action === "deleteBulk") return deleteBulkPatients(sheet, data, sheetName);

    return errorResponse("Action '" + action + "' tidak dikenali.");
  } catch (error) {
    return errorResponse(error.toString());
  } finally {
    lock.releaseLock();
  }
}

/** 
 * HIGH PERFORMANCE: Get ALL months data in ONE request 
 */
/** 
 * HIGH PERFORMANCE: Get ALL months data in ONE request 
 */
function getAllYear(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const result = {};

  months.forEach(month => {
    const sheetNameWithYear = month + " " + year;
    let sheet = ss.getSheetByName(sheetNameWithYear);
    
    // Fallback: Try search by month name only if with year fails
    if (!sheet) {
      sheet = ss.getSheetByName(month);
    }

    if (sheet) {
      result[sheetNameWithYear] = getAllPatientsRaw(sheet);
    } else {
      result[sheetNameWithYear] = [];
    }
  });

  return successResponse(result);
}

/** Helper extracted from getAllPatients to avoid code duplication with Dynamic Column Mapping */
function getAllPatientsRaw(sheet, sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "umum_" + sheetName;

  // Coba dari cache dulu - ini yang membuat respons jadi instan
  const cached = getFromCache(cache, cacheKey);
  if (cached) return cached;

  // Cache miss: baca dari sheet (proses normal)
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const dataStart = 2;
  const numRows = lastRow - dataStart;
  if (numRows <= 0) return [];

  const displayValues = sheet.getRange(dataStart + 1, 1, numRows, sheet.getLastColumn()).getDisplayValues();

  // Find headers for mapping (search in Row 1 or 2)
  const headerSearchRange = sheet.getRange(1, 1, 2, sheet.getLastColumn()).getValues();
  let headers = headerSearchRange[1].map(h => String(h).toUpperCase().trim());
  if (!headers.includes("TANGGAL") && headerSearchRange[0].map(h => String(h).toUpperCase()).includes("TANGGAL")) {
    headers = headerSearchRange[0].map(h => String(h).toUpperCase().trim());
  }

  // Create column mapping dynamically (exact match first, then partial for multi-char keys)
  const colIndex = {};
  COLUMN_MAPPING.forEach(key => {
    let idx = headers.indexOf(key);
    if (idx === -1) idx = headers.indexOf(key.replace("_", " "));
    if (idx === -1 && key.length > 1) {
      idx = headers.findIndex(h => h.includes(key));
    }
    colIndex[key] = idx;
  });

  const results = [];
  for (let i = 0; i < displayValues.length; i++) {
    const row = displayValues[i];
    let obj = { id: dataStart + 1 + i };
    COLUMN_MAPPING.forEach((key) => {
      const idx = colIndex[key];
      obj[key] = (idx !== -1 && idx !== undefined) ? row[idx] : "";
    });
    results.push(obj);
  }

  // Simpan ke cache untuk request berikutnya
  saveToCache(cache, cacheKey, results);

  return results;
}

function getAllPatients(sheet, sheetName) {
  return successResponse(getAllPatientsRaw(sheet, sheetName));
}

function addPatient(sheet, data, sheetName) {
  const newRow = COLUMN_MAPPING.map((key) => data[key] || "");
  sheet.appendRow(newRow);
  invalidateCache(CacheService.getScriptCache(), sheetName);
  return successResponse({
    message: "Data berhasil ditambahkan",
    id: sheet.getLastRow(),
  });
}

function updatePatient(sheet, data, sheetName) {
  const id = parseInt(data.id);
  COLUMN_MAPPING.forEach((key, i) => {
    if (data[key] !== undefined) sheet.getRange(id, i + 1).setValue(data[key]);
  });
  invalidateCache(CacheService.getScriptCache(), sheetName);
  return successResponse({ message: "Data berhasil diperbarui" });
}

function deletePatient(sheet, data, sheetName) {
  const id = parseInt(data.id);
  if (id >= 3) sheet.deleteRow(id);
  invalidateCache(CacheService.getScriptCache(), sheetName);
  return successResponse({ message: "Data berhasil dihapus" });
}

function deleteBulkPatients(sheet, data, sheetName) {
  const ids = data.ids;
  if (!ids || !Array.isArray(ids)) return errorResponse("Invalid IDs");
  ids
    .sort((a, b) => b - a)
    .forEach((id) => {
      if (parseInt(id) >= 3) sheet.deleteRow(parseInt(id));
    });
  invalidateCache(CacheService.getScriptCache(), sheetName);
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
  const headers = values[0].map(h => String(h).toUpperCase().trim());
  
  const uCol = headers.findIndex(h => h.includes("USERNAME")),
    pCol = headers.findIndex(h => h.includes("PASSWORD")),
    rCol = headers.findIndex(h => h.includes("ROLE")),
    nCol = headers.findIndex(h => h.includes("NAMA_LENGKAP"));

  if (uCol === -1 || pCol === -1) return { success: false, message: "Header kolom USERNAME atau PASSWORD tidak ditemukan" };

  for (let i = 1; i < values.length; i++) {
    if (
      String(values[i][uCol]).trim() === String(data.username).trim() &&
      String(values[i][pCol]).trim() === String(data.password).trim()
    ) {
      return {
        success: true,
        user: {
          USERNAME: values[i][uCol],
          ROLE: values[i][rCol] || "admin",
          NAMA_LENGKAP: values[i][nCol] || values[i][uCol],
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
  const headers = data[0].map(h => String(h).toUpperCase().trim());
  
  const uCol = headers.findIndex(h => h === "USERNAME" || h === "ID"),
        pCol = headers.findIndex(h => h === "PASSWORD"),
        rCol = headers.findIndex(h => h === "ROLE"),
        nCol = headers.findIndex(h => h === "NAMA_LENGKAP" || h === "NAMALENGKAP" || h === "NAMA" || h.includes("NAMA"));

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const username = data[i][uCol];
    if (!username) continue;
    users.push({
      id: i + 1,
      username: username,
      password: data[i][pCol],
      role: data[i][rCol] || "admin",
      fullName: data[i][nCol] || username,
    });
  }
  return users;
}

function saveUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab USERS missing" };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).toUpperCase().trim());

  const uIdx = headers.findIndex(h => h === "USERNAME" || h === "ID"),
        pIdx = headers.findIndex(h => h === "PASSWORD"),
        rIdx = headers.findIndex(h => h === "ROLE"),
        nIdx = headers.findIndex(h => h === "NAMA_LENGKAP" || h === "NAMALENGKAP" || h === "NAMA" || h.includes("NAMA"));

  if (data.id) {
    const row = parseInt(data.id);
    if (data.username && uIdx !== -1) sheet.getRange(row, uIdx + 1).setValue(data.username);
    if (data.password && pIdx !== -1) sheet.getRange(row, pIdx + 1).setValue(data.password);
    if (data.role && rIdx !== -1) sheet.getRange(row, rIdx + 1).setValue(data.role);
    if (data.fullName && nIdx !== -1) sheet.getRange(row, nIdx + 1).setValue(data.fullName);
    return { success: true, message: "User updated" };
  } else {
    // Check duplication
    const users = sheet.getRange(2, uIdx + 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < users.length; i++) {
      if (String(users[i][0]).trim() === String(data.username).trim()) {
        return { success: false, message: "Username already exists" };
      }
    }
    // Prepare new row in correct order
    const newRow = new Array(headers.length).fill("");
    if (uIdx !== -1) newRow[uIdx] = data.username;
    if (pIdx !== -1) newRow[pIdx] = data.password;
    if (rIdx !== -1) newRow[rIdx] = data.role || "admin";
    if (nIdx !== -1) newRow[nIdx] = data.fullName || data.username;
    sheet.appendRow(newRow);
    return { success: true, message: "User added" };
  }
}

function deleteUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("USERS") || ss.getSheetByName("Users");
  if (!sheet) return { success: false, message: "Tab USERS missing" };
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
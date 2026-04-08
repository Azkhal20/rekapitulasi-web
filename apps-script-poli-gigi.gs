/**
 * REKAPITULASI WEB - APPS SCRIPT POLI GIGI V9 (WITH CACHE)
 * Fitur: CRUD + Bulk Delete Pasien (Tanpa Auth) + CacheService
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

// Helper: simpan data ke cache (dengan chunking karena limit GAS 100KB)
function saveToCache(cache, key, data) {
  try {
    const json = JSON.stringify(data);
    const chunkSize = 90000; // 90KB per chunk untuk jaga-jaga
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
    // Gagal cache tidak masalah, data tetap dikembalikan dari sheet
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
      if (!chunk) return null; // salah satu chunk expired, rebuild
      json += chunk;
    }
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Helper: hapus cache untuk sheet tertentu
function invalidateCache(cache, sheetName) {
  try {
    const key = "gigi_" + sheetName;
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

    if (action === "getAll") return getAllPatients(sheet, sheetName);
    if (action === "add") return addPatient(sheet, body, sheetName);
    if (action === "update") return updatePatient(sheet, body, sheetName);
    if (action === "delete") return deletePatient(sheet, body, sheetName);
    if (action === "deleteBulk") return deleteBulkPatients(sheet, body, sheetName);

    return getAllPatients(sheet, sheetName);
  } catch (err) {
    return errorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

// PATIENT CRUD
function getAllPatients(sheet, sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "gigi_" + sheetName;

  // Coba ambil dari cache dulu
  const cached = getFromCache(cache, cacheKey);
  if (cached) {
    return successResponse(cached);
  }

  // Cache miss: baca dari sheet
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

  // Simpan ke cache
  saveToCache(cache, cacheKey, result);

  return successResponse(result);
}

function addPatient(sheet, data, sheetName) {
  const newRow = COLUMN_MAPPING.map((key) => data[key] || "");
  sheet.appendRow(newRow);
  // Hapus cache agar data terbaru langsung tampil
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
  // Hapus cache agar data terbaru langsung tampil
  invalidateCache(CacheService.getScriptCache(), sheetName);
  return successResponse({ message: "Data berhasil diperbarui" });
}

function deletePatient(sheet, data, sheetName) {
  sheet.deleteRow(parseInt(data.id));
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

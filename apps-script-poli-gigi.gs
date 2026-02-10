/**
 * REKAPITULASI WEB - APPS SCRIPT POLI GIGI V8 (FINAL)
 * Fitur: CRUD + Bulk Delete Pasien (Tanpa Auth)
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

    if (action === "getAll") return getAllPatients(sheet);
    if (action === "add") return addPatient(sheet, body);
    if (action === "update") return updatePatient(sheet, body);
    if (action === "delete") return deletePatient(sheet, body);
    if (action === "deleteBulk") return deleteBulkPatients(sheet, body);

    return getAllPatients(sheet);
  } catch (err) {
    return errorResponse(err.toString());
  } finally {
    lock.releaseLock();
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
  sheet.deleteRow(parseInt(data.id));
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

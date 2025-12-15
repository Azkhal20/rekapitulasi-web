// === APPS SCRIPT V4 (STABLE BACK TO BASICS) ===

const SHEET_NAME = "POLI UMUM";
const SHEET = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = e.parameter.action;
    let body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } 
      catch (_) {}
    }

    if (action === "getAll") return getAll();
    if (action === "getById") return getById(e);
    if (action === "add") return addPatient(body);
    if (action === "update") return updatePatient(body);
    if (action === "delete") return deletePatient(body);

    return jsonResponse({ error: "Unknown action" });

  } catch (err) {
    return jsonResponse({ error: "Server Error: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAll() {
  const lastRow = SHEET.getLastRow();
  const lastCol = SHEET.getLastColumn();
  
  if (lastRow <= 1) return jsonResponse([]); 

  // Baca semua data dari A1 sampai ujung
  // Row 1 = Header
  // Row 2+ = Data
  const values = SHEET.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0]; // Row 1
  const dataRows = values.slice(1); // Row 2 ke bawah

  const result = dataRows.map((row, i) => {
    // i=0 adalah Data baris pertama (Row 2)
    // Jadi ID = i + 2. Ini PASTI sinkron dengan physical row number.
    let obj = { id: i + 2 };
    headers.forEach((h, j) => {
      if (h) {
         if (row[j] instanceof Date) obj[h] = row[j].toISOString();
         else obj[h] = row[j];
      }
    });
    return obj;
  });

  return jsonResponse(result);
}

function getById(e) {
  const id = Number(e.parameter.id);
  const lastCol = SHEET.getLastColumn();
  const headers = SHEET.getRange(1, 1, 1, lastCol).getValues()[0];
  const row = SHEET.getRange(id, 1, 1, lastCol).getValues()[0];
  let obj = { id };
  headers.forEach((h, j) => { if(h) obj[h] = row[j]; });
  return jsonResponse(obj);
}

function addPatient(body) {
  const row = [
    body.TANGGAL || "", body.TAHUN || "", body.BULAN || "", body.HARI || "",
    body.ENAM_BELAS_LIMA_BELAS || "", body.L || "", body.P || "", 
    body.NAMA || "", body.USIA || "", body.NIP || "", body.OBS_TTV || "",
    body.KELUHAN || "", body.DIAGNOSIS || "", body.ICD10 || "", 
    body.TINDAKAN || "", body.OBAT || ""
  ];
  SHEET.appendRow(row);
  return jsonResponse({ success: true, message: "Added" });
}

function updatePatient(body) {
  const id = Number(body.id);
  // Validasi ID, jangan sampai edit Header (ID 1)
  if (!id || id < 2) return jsonResponse({ error: "Invalid ID" });

  const row = [
    body.TANGGAL || "", body.TAHUN || "", body.BULAN || "", body.HARI || "",
    body.ENAM_BELAS_LIMA_BELAS || "", body.L || "", body.P || "", 
    body.NAMA || "", body.USIA || "", body.NIP || "", body.OBS_TTV || "",
    body.KELUHAN || "", body.DIAGNOSIS || "", body.ICD10 || "", 
    body.TINDAKAN || "", body.OBAT || ""
  ];
  
  SHEET.getRange(id, 1, 1, row.length).setValues([row]);
  return jsonResponse({ success: true, message: "Updated" });
}

function deletePatient(body) {
  const id = Number(body.id);
  if (!id || id < 2) return jsonResponse({ error: "Invalid ID" });
  
  SHEET.deleteRow(id);
  return jsonResponse({ success: true, message: "Deleted" });
}

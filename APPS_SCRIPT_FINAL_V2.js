// === APPS SCRIPT FIX ALIGNMENT ===

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
      catch (parseErr) { console.error("JSON Parse Error:", parseErr); }
    }

    let result;
    if (action === "getAll") result = getAll();
    else if (action === "getById") result = getById(e);
    else if (action === "add") result = addPatient(body);
    else if (action === "update") result = updatePatient(body);
    else if (action === "delete") result = deletePatient(body);
    else result = { error: "Unknown action: " + action };

    return jsonResponse(result);

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

// === OPERATIONS ===

function getAll() {
  const lastRow = SHEET.getLastRow();
  const lastCol = SHEET.getLastColumn();
  
  if (lastRow < 1) return [];

  // PENTING: Paksa baca dari A1 agar index sesuai baris
  // getRange(row, col, numRows, numCols)
  const data = SHEET.getRange(1, 1, lastRow, lastCol).getValues();
  
  const headers = data.shift(); // Remove Header (Row 1)
  
  return data.map((row, i) => {
    // i starts at 0. data[0] is originally Row 2.
    // So ID = i + 2 matches Row 2.
    let obj = { id: i + 2 }; 
    headers.forEach((h, j) => {
      if (row[j] instanceof Date) { obj[h] = row[j].toISOString(); } 
      else { obj[h] = row[j]; }
    });
    return obj;
  });
}

function getById(e) {
  const id = Number(e.parameter.id);
  const lastCol = SHEET.getLastColumn();
  
  // Ambil header row 1
  const headers = SHEET.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Ambil data row ID
  const row = SHEET.getRange(id, 1, 1, lastCol).getValues()[0];
  
  let obj = { id };
  headers.forEach((h, j) => obj[h] = row[j]);
  return obj;
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
  return { success: true, message: "Added successfully" };
}

function updatePatient(body) {
  const id = Number(body.id);
  if (!id || id < 2) return { error: "Invalid ID" };

  const row = [
    body.TANGGAL || "", body.TAHUN || "", body.BULAN || "", body.HARI || "",
    body.ENAM_BELAS_LIMA_BELAS || "", body.L || "", body.P || "", 
    body.NAMA || "", body.USIA || "", body.NIP || "", body.OBS_TTV || "",
    body.KELUHAN || "", body.DIAGNOSIS || "", body.ICD10 || "", 
    body.TINDAKAN || "", body.OBAT || ""
  ];
  
  SHEET.getRange(id, 1, 1, row.length).setValues([row]);
  return { success: true, message: "Updated successfully" };
}

function deletePatient(body) {
  const id = Number(body.id);
  if (!id || id < 2) return { error: "Invalid ID" };
  
  SHEET.deleteRow(id);
  return { success: true, message: "Deleted successfully" };
}

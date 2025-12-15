// === APPS SCRIPT V3 (SMART HEADER DETECTION) ===

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

// === HELPER: FIND HEADER ROW ===
function findHeaderRowIndex(values) {
  for (let i = 0; i < values.length; i++) {
    // Cari baris yang punya kolom "NAMA" (case insensitive)
    // Ubah string row jadi satu teks besar biar gampang cari
    const rowStr = values[i].join("||").toUpperCase();
    if (rowStr.includes("NAMA") && rowStr.includes("TANGGAL")) {
      return i;
    }
  }
  return 0; // Default ke baris 1 jika tidak ketemu
}

// === OPERATIONS ===

function getAll() {
  const lastRow = SHEET.getLastRow();
  const lastCol = SHEET.getLastColumn();
  if (lastRow < 1) return [];

  const rawData = SHEET.getRange(1, 1, lastRow, lastCol).getValues();
  
  // Deteksi Header otomatis
  const headerIdx = findHeaderRowIndex(rawData);
  const headers = rawData[headerIdx];
  
  // Data dimulai SETELAH header
  const dataRows = rawData.slice(headerIdx + 1);
  
  return dataRows.map((row, i) => {
    // Kalkulasi ID Real:
    // Header Row Index (0-based) + 1 (to make it 1-based)
    // + i (index data saat ini) + 1 (karena data mulai setelah header)
    const realRowNumber = (headerIdx + 1) + (i + 1);
    
    let obj = { id: realRowNumber }; 
    headers.forEach((h, j) => {
      // Handle Column Name mapping cleanly
      if(h) {
         if (row[j] instanceof Date) { obj[h] = row[j].toISOString(); } 
         else { obj[h] = row[j]; }
      }
    });
    return obj;
  });
}

function getById(e) {
  const id = Number(e.parameter.id);
  const lastCol = SHEET.getLastColumn();
  const lastRow = SHEET.getLastRow();
  
  // Find Header again to be safe
  const rawHeaders = SHEET.getRange(1, 1, Math.min(10, lastRow), lastCol).getValues();
  const headerIdx = findHeaderRowIndex(rawHeaders);
  const headers = rawHeaders[headerIdx];
  
  const row = SHEET.getRange(id, 1, 1, lastCol).getValues()[0];
  
  let obj = { id };
  headers.forEach((h, j) => { if(h) obj[h] = row[j]; });
  return obj;
}

function addPatient(body) {
  // Mapping manual agar urutan sesuai struktur sheet standart
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
  // Validasi extra: Jangan hapus jika ID terlalu kecil (header area)
  if (!id || id <= 1) return { error: "Invalid ID range" };
  
  SHEET.deleteRow(id);
  // Fix: Return empty data just in case
  return { success: true, message: "Deleted successfully" };
}

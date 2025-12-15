// === FINAL & ROBUST APPS SCRIPT FOR NEXT.JS ===

const SHEET_NAME = "POLI UMUM";
const SHEET = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);

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
    
    // Log request parameters for debugging
    console.log("Action:", action);
    
    // Robust Body Parsing
    // Karena kita kirim "text/plain" dari frontend untuk avoid CORS Preflight,
    // Google mungkin tidak otomatis parse postData.contents sebagai JSON.
    // Kita harus parse manual.
    let body = {};
    
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Fallback: Jika gagal parse, mungkin formatnya aneh, log errornya
        console.error("JSON Parse Error:", parseErr);
        return jsonResponse({ error: "Invalid JSON Body: " + parseErr.toString() });
      }
    }

    let result;
    if (action === "getAll") {
      result = getAll();
    } else if (action === "getById") {
      result = getById(e);
    } else if (action === "add") {
      result = addPatient(body);
    } else if (action === "update") {
      result = updatePatient(body);
    } else if (action === "delete") {
      result = deletePatient(body);
    } else {
      result = { error: "Unknown action: " + action };
    }

    return jsonResponse(result);

  } catch (err) {
    console.error("Server Error:", err);
    return jsonResponse({ error: "Server Error: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  // Return JSON response.
  // Google Apps Script will AUTOMATICALLY add Access-Control-Allow-Origin: *
  // IF executed as Web App with "Anyone" access.
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// === OPERATIONS ===

function getAll() {
  const data = SHEET.getDataRange().getValues();
  if (data.length === 0) return [];
  
  const headers = data.shift(); // remove header
  
  // Format result
  return data.map((row, i) => {
    let obj = { id: i + 2 }; // Row index starts at 1, header is 1, so data starts at 2
    headers.forEach((h, j) => {
      // Handle Date Objects specifically if needed, otherwise send as string
      if (row[j] instanceof Date) {
        obj[h] = row[j].toISOString();
      } else {
        obj[h] = row[j];
      }
    });
    return obj;
  });
}

function getById(e) {
  const id = Number(e.parameter.id);
  const data = SHEET.getDataRange().getValues();
  if (id < 2 || id > data.length) return { error: "Not found" };
  
  const headers = data[0];
  const row = data[id - 1]; // Array index
  
  let obj = { id };
  headers.forEach((h, j) => obj[h] = row[j]);
  return obj;
}

function addPatient(body) {
  // Mapping field frontend -> urutan kolom Sheet
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
  // Validasi ID
  if (!id || id < 2) return { error: "Invalid ID" };

  const row = [
    body.TANGGAL || "", body.TAHUN || "", body.BULAN || "", body.HARI || "",
    body.ENAM_BELAS_LIMA_BELAS || "", body.L || "", body.P || "", 
    body.NAMA || "", body.USIA || "", body.NIP || "", body.OBS_TTV || "",
    body.KELUHAN || "", body.DIAGNOSIS || "", body.ICD10 || "", 
    body.TINDAKAN || "", body.OBAT || ""
  ];
  
  // setValues butuh array 2D: [[col1, col2, ...]]
  SHEET.getRange(id, 1, 1, row.length).setValues([row]);
  return { success: true, message: "Updated successfully" };
}

function deletePatient(body) {
  const id = Number(body.id);
  if (!id || id < 2) return { error: "Invalid ID" };
  
  SHEET.deleteRow(id);
  return { success: true, message: "Deleted successfully" };
}

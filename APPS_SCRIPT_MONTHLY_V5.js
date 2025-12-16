/**
 * REKAPITULASI WEB - APPS SCRIPT BACKEND V5 (MONTHLY SUPPORT)
 * 
 * Features:
 * - Dynamic Sheet Selection (JANUARI, FEBRUARI, etc.)
 * - CORS Headers (Public API)
 * - JSON Response
 * - CRUD Logic (Add, Update, Delete)
 * - ID Management (Row ID based)
 * 
 * IMPORTANT: Specify 'sheetName' in parameters to switch months.
 * Default: 'POLI UMUM' (fallback)
 */

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
    
    // Default sheet fallback
    const DEFAULT_SHEET = 'POLI UMUM'; 
    let sheetName = e.parameter.sheetName || DEFAULT_SHEET;

    // Handle Preflight OPTIONS request
    if (e.postData && e.postData.type === "application/x-www-form-urlencoded") {
      // Sometimes basic fetch sends this
    }
    
    // Parse POST Body if exists
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
        // Override sheetName if present in body
        if (body.sheetName) sheetName = body.sheetName;
      } catch (err) {
        // Assume raw text/plain if JSON parse fails
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    // If sheet doesn't exist, try to return error or create it?
    // Allowing fallback strict error for safety
    if (!sheet) {
      return errorResponse("Sheet '" + sheetName + "' tidak ditemukan. Pastikan nama bulan sesuai (kapital perhatikan).");
    }

    if (action === "getAll") {
      return getAllPatients(sheet);
    } else if (action === "getById") {
      const id = e.parameter.id;
      return getPatientById(sheet, id);
    } else if (action === "add") {
      return addPatient(sheet, body);
    } else if (action === "update") {
      return updatePatient(sheet, body);
    } else if (action === "delete") {
      return deletePatient(sheet, body);
    } else {
      return getAllPatients(sheet); // Default action
    }

  } catch (err) {
    return errorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

// --- CRUD FUNCTIONS ---

function getAllPatients(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return successResponse([]);
  }

  // Get headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Get data (Row 2 to Last)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const dataValues = dataRange.getValues(); // Formatted values? better getValues for raw edit

  // Get DisplayValues for Dates if needed, but getValues is safer for data
  const displayValues = dataRange.getDisplayValues(); 

  const result = dataValues.map((row, i) => {
    let obj = {
      id: i + 2 // Row index (1-based)
    };
    
    headers.forEach((header, index) => {
      // Use display value for Date/String consistency, or raw value?
      // Using raw value is safer effectively, frontend handles format
      // Actually, for dates, display value "15 Nov 2025" is what we want?
      // Let's stick to raw values to be safe for editing
      
      // Let's try to be smart: if header allows, use header key
      if (header) {
        obj[header] = displayValues[i][index]; // Use Display Value (String) to capture "15 Nov 2025" etc.
      }
    });
    return obj;
  });

  return successResponse(result);
}

function getPatientById(sheet, id) {
  const rowIndex = parseInt(id);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];

  let obj = { id: rowIndex };
  headers.forEach((header, index) => {
    if (header) obj[header] = rowValues[index];
  });

  return successResponse(obj);
}

function addPatient(sheet, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  const nextRow = lastRow + 1;

  const newRow = headers.map(header => {
    return data[header] || "";
  });

  sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
  return successResponse({ message: "Data berhasil ditambahkan", id: nextRow });
}

function updatePatient(sheet, data) {
  const id = parseInt(data.id);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Update Logic
  const updateRow = headers.map(header => {
    return data[header] !== undefined ? data[header] : "";
  });

  sheet.getRange(id, 1, 1, updateRow.length).setValues([updateRow]);
  return successResponse({ message: "Data berhasil diperbarui" });
}

function deletePatient(sheet, data) {
  const id = parseInt(data.id);
  sheet.deleteRow(id);
  return successResponse({ message: "Data berhasil dihapus" });
}

// --- HELPERS ---

function successResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function errorResponse(message) {
  const output = ContentService.createTextOutput(JSON.stringify({ error: message }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

import { GOOGLE_SHEETS_CONFIG } from '@/config/googleSheets';
import { Patient } from '@/types/patient';

/**
 * Fetch patient data from Google Sheets
 * Uses Google Sheets API v4 with API key authentication
 */
export async function fetchPatientData(): Promise<Patient[]> {
  const { apiKey, spreadsheetId, sheetName, range } = GOOGLE_SHEETS_CONFIG;
  
  const encodedRange = encodeURIComponent(`${sheetName}!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes to reduce API calls
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Sheets API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`Google Sheets API Error (${response.status}): ${response.statusText}. Ensure the sheet is Public or the API Key has access.`);
    }

    const data = await response.json();
    const rows = data.values as string[][];

    if (!rows || rows.length === 0) {
      return [];
    }

    // First row is headers
    const headers = rows[0];
    
    // Convert remaining rows to objects
    const patients: Patient[] = rows.slice(1).map((row, index) => {
      const patient: Patient = {
        id: index + 1, // Add unique ID for each row
      };
      
      headers.forEach((header, colIndex) => {
        // Use header as key, handle missing values
        patient[header] = row[colIndex] || '';
      });
      
      return patient;
    });

    return patients;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

/**
 * Get column definitions from sheet headers
 */
export async function getColumnDefinitions() {
  const { apiKey, spreadsheetId, sheetName } = GOOGLE_SHEETS_CONFIG;
  
  const encodedRange = encodeURIComponent(`${sheetName}!A1:Z1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch headers: ${response.statusText}`);
    }

    const data = await response.json();
    const headers = data.values?.[0] || [];

    return headers.map((header: string) => ({
      field: header,
      headerName: header,
      width: 150,
      sortable: true,
      filterable: true,
    }));
  } catch (error) {
    console.error('Error fetching column definitions:', error);
    return [];
  }
}

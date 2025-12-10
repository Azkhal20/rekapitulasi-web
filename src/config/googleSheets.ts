// Google Sheets API Configuration
export const GOOGLE_SHEETS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '',
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || '',
  sheetName: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_NAME || 'POLI UMUM',
  range: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_RANGE || 'A1:Z1000',
};

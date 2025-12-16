// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';

export interface PatientData {
  id?: number;
  TANGGAL: string;
  TAHUN: string;
  BULAN: string;
  HARI: string;
  ENAM_BELAS_LIMA_BELAS: string;
  L: string;
  P: string;
  NAMA: string;
  USIA: string;
  NIP: string;
  OBS_TTV: string;
  KELUHAN: string;
  DIAGNOSIS: string;
  ICD10: string;
  TINDAKAN: string;
  OBAT: string;
}

class PatientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = GOOGLE_SCRIPT_URL;
  }

  private checkUrl() {
    if (!this.baseUrl || this.baseUrl.includes('YOUR_DEPLOYMENT_ID')) {
      throw new Error('URL Apps Script belum dikonfigurasi di .env.local');
    }
  }

  private async parseResponse(response: Response, action: string) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      const text = await response.text();
      console.error('HTML Response:', text.substring(0, 200));
      throw new Error('Apps Script error (HTML response). Cek deployment.');
    }
    
    try {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response for action: ${action}`);
      }
      throw error;
    }
  }

  // GET ALL with SheetName Param
  async getAllPatients(sheetName: string = "JANUARI"): Promise<PatientData[]> {
    try {
      this.checkUrl();
      // Append sheetName to URL
      const url = `${this.baseUrl}?action=getAll&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        // headers removed to avoid preflight CORS options request
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getAll');
    } catch (error) {
      console.error(`Error fetching patients (Sheet: ${sheetName}):`, error);
      throw error;
    }
  }

  // GET BY ID
  async getPatientById(id: number, sheetName: string = "JANUARI"): Promise<PatientData> {
    try {
      this.checkUrl();
      const url = `${this.baseUrl}?action=getById&id=${id}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        // headers removed to avoid preflight CORS options request
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getById');
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  // ADD (Pass sheetName in Body)
  async addPatient(patientData: Omit<PatientData, 'id'>, sheetName: string = "JANUARI"): Promise<{ message: string }> {
    try {
      this.checkUrl();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Inject sheetName into body
      const payload = { ...patientData, sheetName };

      const response = await fetch(`${this.baseUrl}?action=add`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain to avoid preflight
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'add');
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }

  // UPDATE (Pass sheetName in Body, NO +1 HOTFIX)
  async updatePatient(id: number, patientData: Omit<PatientData, 'id'>, sheetName: string = "JANUARI"): Promise<{ message: string }> {
    try {
      this.checkUrl();
      // REMOVED HOTFIX +1
      
      console.log('🔵 UPDATE Request');
      console.log('Sheet:', sheetName);
      console.log('ID:', id);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const payload = { id: id, ...patientData, sheetName };

      const response = await fetch(`${this.baseUrl}?action=update`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'update');
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  // DELETE (Pass sheetName in Body, NO +1 HOTFIX)
  async deletePatient(id: number, sheetName: string = "JANUARI"): Promise<{ message: string }> {
    try {
      this.checkUrl();
      // REMOVED HOTFIX +1

      console.log('🔴 DELETE Request');
      console.log('Sheet:', sheetName);
      console.log('ID:', id);
      
      const payload = { id: id, sheetName };

      const response = await fetch(`${this.baseUrl}?action=delete`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'delete');
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();

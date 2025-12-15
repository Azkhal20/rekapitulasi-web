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

  // GET ALL
  async getAllPatients(): Promise<PatientData[]> {
    try {
      this.checkUrl();
      const url = `${this.baseUrl}?action=getAll&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getAll');
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  // GET BY ID
  async getPatientById(id: number): Promise<PatientData> {
    try {
      this.checkUrl();
      const url = `${this.baseUrl}?action=getById&id=${id}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getById');
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  // ADD (ID Offset not needed for Add)
  async addPatient(patientData: Omit<PatientData, 'id'>): Promise<{ message: string }> {
    try {
      this.checkUrl();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.baseUrl}?action=add`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(patientData),
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

  // UPDATE (WITH HOTFIX +1 OFFSET)
  async updatePatient(id: number, patientData: Omit<PatientData, 'id'>): Promise<{ message: string }> {
    try {
      this.checkUrl();
      
      // HOTFIX: Add +1 to ID to fix off-by-one error
      const targetId = id + 1;
      
      console.log('🔵 UPDATE Request');
      console.log('Original ID from Table:', id);
      console.log('Corrected ID sent to Server:', targetId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.baseUrl}?action=update`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ id: targetId, ...patientData }),
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

  // DELETE (WITH HOTFIX +1 OFFSET)
  async deletePatient(id: number): Promise<{ message: string }> {
    try {
      this.checkUrl();

      // HOTFIX: Add +1 to ID to fix off-by-one error
      const targetId = id + 1;

      console.log('🔴 DELETE Request');
      console.log('Original ID from Table:', id);
      console.log('Corrected ID sent to Server:', targetId);
      
      const response = await fetch(`${this.baseUrl}?action=delete`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ id: targetId }),
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

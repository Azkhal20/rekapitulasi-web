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

export type PoliType = 'umum' | 'gigi';

class PatientService {
  
  private getBaseUrl(poli: PoliType = 'umum'): string {
    const url = poli === 'gigi' 
      ? process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_GIGI 
      : process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM; // Fallback / Default
      
    return url || '';
  }

  private checkUrl(baseUrl: string) {
    if (!baseUrl || baseUrl.includes('YOUR_DEPLOYMENT_ID')) {
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

  // AMBIL SEMUA DATA
  async getAllPatients(sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<PatientData[]> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);
      
      const url = `${baseUrl}?action=getAll&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getAll');
    } catch (error) {
      console.error(`Error fetching patients (Sheet: ${sheetName}, Poli: ${poli}):`, error);
      throw error;
    }
  }

  // AMBIL DATA BERDASARKAN ID
  async getPatientById(id: number, sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<PatientData> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);
      
      const url = `${baseUrl}?action=getById&id=${id}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getById');
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  // TAMBAH PASIEN
  async addPatient(patientData: Omit<PatientData, 'id'>, sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<{ message: string }> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const payload = { ...patientData, sheetName };

      const response = await fetch(`${baseUrl}?action=add`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

  // UPDATE PASIEN
  async updatePatient(id: number, patientData: Omit<PatientData, 'id'>, sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<{ message: string }> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);
      
      console.log(`🔵 UPDATE Request [${poli}]`);
      console.log('Sheet:', sheetName);
      console.log('ID:', id);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const payload = { id: id, ...patientData, sheetName };

      const response = await fetch(`${baseUrl}?action=update`, {
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

  // HAPUS PASIEN
  async deletePatient(id: number, sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<{ message: string }> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);

      console.log(`🔴 DELETE Request [${poli}]`);
      console.log('Sheet:', sheetName);
      console.log('ID:', id);
      
      const payload = { id: id, sheetName };

      const response = await fetch(`${baseUrl}?action=delete`, {
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

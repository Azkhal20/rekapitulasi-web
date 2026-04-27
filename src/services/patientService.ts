export interface PatientData {
  id?: number;
  TANGGAL: string;
  TAHUN: string;
  BULAN: string;
  HARI: string;
  "16-15"?: string;
  ENAM_BELAS_LIMA_BELAS?: string;
  L: string;
  P: string;
  BARU: string;
  LAMA: string;
  NAMA: string;
  USIA: string;
  NIP: string;
  OBS_TTV: string;
  KELUHAN: string;
  DIAGNOSIS: string;
  ICD10: string;
  TINDAKAN: string;
  OBAT: string;
  // Kolom Rujukan (Q-Z)
  RUJUK_FASKES_PERTAMA_PB?: string;
  RUJUK_FASKES_PERTAMA_PL?: string;
  RUJUK_FKRTL_PB?: string;
  RUJUK_FKRTL_PL?: string;
  PTM_RUJUK_FKRTL_PB?: string;
  PTM_RUJUK_FKRTL_PL?: string;
  DIRUJUK_BALIK_PUSKESMAS_PB?: string;
  DIRUJUK_BALIK_PUSKESMAS_PL?: string;
  DIRUJUK_BALIK_FKRTL_PB?: string;
  DIRUJUK_BALIK_FKRTL_PL?: string;
}

export type PoliType = 'umum' | 'gigi';

class PatientService {
  // Simple cache to prevent redundant fetches
  private cache: Map<string, { data: PatientData[], timestamp: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Request bottleneck to prevent GAS concurrency limits
  private activeRequests: Map<string, Promise<PatientData[]>> = new Map();
  
  private getBaseUrl(poli: PoliType = 'umum'): string {
    const url = poli === 'gigi' 
      ? process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_GIGI 
      : process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM;
      
    if (!url) {
      console.error(`[API ERROR] URL untuk poli ${poli} tidak ditemukan di .env.local!`);
      return '';
    }
    return url;
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

  // INSTANCE QUEUE: Individual queue per poli/deployment to allow parallel loading of Umum vs Gigi
  private requestQueue: Promise<unknown> = Promise.resolve();

  // AMBIL SEMUA DATA (Optimized with Cache, Retry, & Sequential Per-Poli Queue)
  async getAllPatients(sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<PatientData[]> {
    const cacheKey = `${poli}-${sheetName}`;
    
    // 1. Check Cache first (Instant, no queueing needed)
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    // 2. Check if there's an ongoing request for this specific month/poli
    const ongoing = this.activeRequests.get(cacheKey);
    if (ongoing) return ongoing;

    // 3. Queue the request in the Instance Queue (Umum and Gigi load in parallel)
    const fetchPromise = (async () => {
      // Use the instance queue to wrap our fetch logic
      return this.requestQueue = this.requestQueue.then(async () => {
        // Re-check cache inside queue (maybe it was filled while waiting)
        const reCached = this.cache.get(cacheKey);
        if (reCached && (Date.now() - reCached.timestamp < this.CACHE_TTL)) return reCached.data;

        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        
        while (attempts < MAX_ATTEMPTS) {
          try {
            const baseUrl = this.getBaseUrl(poli);
            this.checkUrl(baseUrl);
            
            // REMOVED 't' parameter to avoid bypassing Google caching and spam detection
            const url = `${baseUrl}?action=getAll&sheetName=${encodeURIComponent(sheetName)}`;
            
            const response = await fetch(url, { 
              method: 'GET',
              mode: 'cors',
              credentials: 'omit',
              redirect: 'follow'
            });

            if (!response.ok) {
              if (response.status === 429) { // Rate limit
                await new Promise(r => setTimeout(r, 2000 * (attempts + 1)));
                attempts++;
                continue;
              }
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await this.parseResponse(response, 'getAll');
            
            // Save to cache
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            
            // JEDA WAJIB: Wait before releasing the global queue to the next request
            await new Promise(r => setTimeout(r, 300));
            
            return data;
          } catch (error) {
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
              console.error(`[API] Final failure for ${sheetName}:`, error);
              return [];
            }
            // Exponential backoff
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }
        return [];
      });
    })();

    // Store in active requests for month deduplication
    this.activeRequests.set(cacheKey, fetchPromise);
    
    try {
      return await fetchPromise;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  // AMBIL DATA SETAHUN SEKALIGUS (High Performance)
  async getAllYearPatients(year: string = "2026", poli: PoliType = 'umum'): Promise<Record<string, PatientData[]>> {
    const baseUrl = this.getBaseUrl(poli);
    this.checkUrl(baseUrl);
    const url = `${baseUrl}?action=getAllYear&year=${encodeURIComponent(year)}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        // Pre-fill individual month caches to speed up other components
        Object.entries(result.data as Record<string, PatientData[]>).forEach(([sheetName, data]) => {
          this.cache.set(`${poli}-${sheetName}`, { data, timestamp: Date.now() });
        });
        return result.data;
      }
      return {};
    } catch (e) {
      console.error(`Gagal memuat rekap tahunan (${poli}):`, e);
      return {};
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

  // HAPUS PASIEN (SINGLE)
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

  // HAPUS PASIEN (BULK)
  async deletePatients(ids: number[], sheetName: string = "JANUARI", poli: PoliType = 'umum'): Promise<{ message: string }> {
    try {
      const baseUrl = this.getBaseUrl(poli);
      this.checkUrl(baseUrl);

      console.log(`🔴 DELETE BULK Request [${poli}]`);
      console.log('Sheet:', sheetName);
      console.log('IDs Count:', ids.length);
      
      const payload = { ids, sheetName };

      const response = await fetch(`${baseUrl}?action=deleteBulk`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'deleteBulk');
    } catch (error) {
      console.error('Error deleting patients bulk:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();

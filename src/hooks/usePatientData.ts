import useSWR from 'swr';
import { patientService, PatientData, PoliType } from '@/services/patientService';

// ============================================================
// FETCHER FUNCTIONS (dipanggil oleh SWR)
// ============================================================

const fetchPatients = async ([sheetName, poli]: [string, PoliType]): Promise<PatientData[]> => {
  return patientService.getAllPatients(sheetName, poli);
};

// ============================================================
// HOOK: usePatients — untuk fetch data per bulan
// ============================================================
export function usePatients(sheetName: string, poli: PoliType) {
  const { data, error, isLoading, mutate } = useSWR(
    sheetName ? [sheetName, poli] : null,
    fetchPatients,
    {
      // Tampil data lama sambil fetch di background (cepat berpindah halaman)
      revalidateOnFocus: false,
      // Cek data baru setiap 3 menit di background (auto-refresh)
      refreshInterval: 3 * 60 * 1000,
      // Deduplikasi jika banyak komponen request key yang sama
      dedupingInterval: 60 * 1000,
      // Simpan data lama saat loading data baru (UI tidak kosong)
      keepPreviousData: true,
    }
  );

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate, // dipakai untuk invalidate (refresh paksa setelah CRUD)
  };
}

// ============================================================
// HOOK: useMultiMonthPatients — untuk fetch data multi-bulan
// (dipakai dashboard untuk rekap statistik)
// ============================================================
export function useMultiMonthPatients(monthNames: string[], poli: PoliType, enabled = true) {
  // Buat key unik dari kombinasi bulan + poli
  const key = enabled && monthNames.length > 0 ? `multi_${poli}_${monthNames.join(',')}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const results = await Promise.all(
        monthNames.map(month => patientService.getAllPatients(month, poli))
      );
      return results.flat();
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 3 * 60 * 1000,
      dedupingInterval: 2 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

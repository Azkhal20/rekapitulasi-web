import { useState, useEffect } from "react";
import { patientService, PatientData, PoliType } from "@/services/patientService";
import { parseDateFromSheet, getMonthName } from "@/utils/dateUtils";

interface AutoValues {
  TAHUN: string;
  BULAN: string;
  HARI: string;
  ENAM_BELAS_LIMA_BELAS: string;
  L: string;
  P: string;
}

export const useAutoCalculate = (tanggal: string, poliType: PoliType, open: boolean) => {
  const [autoValues, setAutoValues] = useState<AutoValues>({
    TAHUN: "",
    BULAN: "",
    HARI: "",
    ENAM_BELAS_LIMA_BELAS: "",
    L: "",
    P: "",
  });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!open || !tanggal) return;

    const fetchAndCalculate = async () => {
      try {
        if (isMounted) setIsCalculating(true);
        
        const dateObj = new Date(tanggal);
        if (isNaN(dateObj.getTime())) return;

        const day = dateObj.getDate();
        const monthIndex = dateObj.getMonth();
        const year = dateObj.getFullYear();
        const sheetName = `${getMonthName(monthIndex)} ${year}`;

        // Fetch current month data
        const currPatients = await patientService.getAllPatients(sheetName, poliType);

        // Fetch previous month/year data if needed for TAHUN/16-15 sequence
        let prevPatients: PatientData[] = [];
        if (monthIndex > 0) {
          const prevSheetName = `${getMonthName(monthIndex - 1)} ${year}`;
          try {
            prevPatients = await patientService.getAllPatients(prevSheetName, poliType);
          } catch (e) {
            console.warn("Could not fetch previous month data", e);
            prevPatients = [];
          }
        }

        const allRelevantPatients = [...prevPatients, ...currPatients];

        // 1. HARI (Reset per Hari)
        const recordsSameDay = currPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          return pDateIso === tanggal;
        });

        let nextHari = 1;
        if (recordsSameDay.length > 0) {
          const maxHari = Math.max(
            ...recordsSameDay.map((r) => parseInt(String(r.HARI || "0")) || 0)
          );
          nextHari = maxHari + 1;
        }

        // 2. BULAN (Reset per Bulan within current month)
        const recordsSameMonth = currPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          const pDate = new Date(pDateIso);
          return pDate.getFullYear() === year && pDate.getMonth() === monthIndex;
        });

        let nextBulan = 1;
        if (recordsSameMonth.length > 0) {
          const maxBulan = Math.max(
            ...recordsSameMonth.map((r) => parseInt(String(r.BULAN || "0")) || 0)
          );
          nextBulan = maxBulan + 1;
        }

        // 3. TAHUN (Absolute count for the year)
        let nextTahun = 1;
        if (currPatients.length > 0) {
          const maxTahunCurr = Math.max(
            ...currPatients.map((r) => parseInt(String(r.TAHUN || "0")) || 0)
          );
          if (maxTahunCurr > 0) nextTahun = maxTahunCurr + 1;
        }

        if (nextTahun === 1 && prevPatients.length > 0 && monthIndex !== 0) {
          const prevYearData = prevPatients.filter((p) => {
            const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
            if (!pDateIso) return false;
            return new Date(pDateIso).getFullYear() === year;
          });
          if (prevYearData.length > 0) {
            const maxTahunPrev = Math.max(
              ...prevYearData.map((r) => parseInt(String(r.TAHUN || "0")) || 0)
            );
            if (maxTahunPrev > 0) nextTahun = maxTahunPrev + 1;
          }
        }

        // 4. 16-15 (Reset Tgl 16 cross-month)
        let cycleStartTime: number;
        if (day >= 16) {
          cycleStartTime = new Date(year, monthIndex, 16).setHours(0, 0, 0, 0);
        } else {
          cycleStartTime = new Date(year, monthIndex - 1, 16).setHours(0, 0, 0, 0);
        }

        const recordsInCycle = allRelevantPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          const pDate = new Date(pDateIso);
          if (isNaN(pDate.getTime())) return false;
          return pDate.setHours(0, 0, 0, 0) >= cycleStartTime;
        });

        let next1615 = 1;
        if (recordsInCycle.length > 0) {
          const maxVal = Math.max(
            ...recordsInCycle.map((r) => {
              const row = r as unknown as Record<string, unknown>;
              const rawVal = row["16-15"] || row.ENAM_BELAS_LIMA_BELAS || "0";
              const val = parseInt(String(rawVal));
              return isNaN(val) ? 0 : val;
            })
          );
          next1615 = maxVal + 1;
        }

        // 5. Gender Cumulative Counters (L/P)
        // Find last non-empty L and P in currPatients
        let lastLVal = 0;
        let lastPVal = 0;

        if (currPatients.length > 0) {
          // Find max value in L column (it's a running count)
          const lValues = currPatients
            .map(p => parseInt(String(p.L || "0")))
            .filter(v => !isNaN(v));
          if (lValues.length > 0) lastLVal = Math.max(...lValues);

          const pValues = currPatients
            .map(p => parseInt(String(p.P || "0")))
            .filter(v => !isNaN(v));
          if (pValues.length > 0) lastPVal = Math.max(...pValues);
        }

        if (isMounted) {
          setAutoValues({
            TAHUN: nextTahun.toString(),
            BULAN: nextBulan.toString(),
            HARI: nextHari.toString(),
            ENAM_BELAS_LIMA_BELAS: next1615.toString(),
            L: (lastLVal + 1) .toString(),
            P: (lastPVal + 1).toString(),
          });
        }
      } catch (e) {
        console.error("Auto calc hook error:", e);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    };

    fetchAndCalculate();
    return () => {
      isMounted = false;
    };
  }, [tanggal, poliType, open]);

  return { autoValues, isCalculating };
};

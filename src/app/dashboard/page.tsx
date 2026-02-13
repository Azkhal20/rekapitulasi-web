"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableFooter,
  TableRow,
  Chip as MuiChip,
  CircularProgress,
  FormControl,
  InputLabel,
  Divider,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WcIcon from "@mui/icons-material/Wc";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
import Link from "next/link";
import TopDiagnosisChart from "@/components/Dashboard/TopDiagnosisChart";
import {
  patientService,
  PoliType,
  PatientData,
} from "@/services/patientService";
import { exportDashboardToExcel } from "@/utils/exportDashboardToExcel";
import { usePermissions } from "@/hooks/usePermissions";

interface PeriodicData {
  label: string;
  total: number;
  umum: number;
  gigi: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [selectedPoli, setSelectedPoli] = useState<PoliType>("umum");
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayPatients: 0,
    todayGender: { L: 0, P: 0 },
    todayType: { baru: 0, lama: 0 },
  });

  // State untuk total gabungan kedua poli
  const [combinedStats, setCombinedStats] = useState({
    totalBothPoli: 0,
    totalL: 0,
    totalP: 0,
    totalBaru: 0,
    totalLama: 0,
    periodTotals: {
      umum: { total: 0, L: 0, P: 0, baru: 0, lama: 0 },
      gigi: { total: 0, L: 0, P: 0, baru: 0, lama: 0 },
    },
  });

  // Periode Filter untuk Real-time Stats
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const date = new Date();
    return date.toLocaleDateString("id-ID", { month: "long" }).toUpperCase();
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  const [serverTime, setServerTime] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [topDiagnosisData, setTopDiagnosisData] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const { isSuperAdmin, isAdmin } = usePermissions();

  useEffect(() => {
    setIsMounted(true);
    // Set initial time only on client
    setServerTime(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    // Optional: Update time every minute
    const interval = setInterval(() => {
      setServerTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const periodName = `${selectedMonth} ${selectedYear}`;

  // LOGIK REKAP TAHUNAN (GABUNGAN)
  const [tableYear, setTableYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  const [periodicRekap, setPeriodicRekap] = useState<PeriodicData[]>([]);
  const [loadingPeriodic, setLoadingPeriodic] = useState(false);

  const fetchPeriodicRekap = useCallback(async () => {
    try {
      setLoadingPeriodic(true);
      const yearNum = parseInt(tableYear);

      // Generate exact 13 periods requested by user
      const generatePeriods = (year: number) => {
        interface PeriodDef {
          label: string;
          startDate: Date;
          endDate: Date;
          monthsInvolved: string[];
        }
        const periods: PeriodDef[] = [];
        const MONTH_NAMES = [
          "Januari",
          "Februari",
          "Maret",
          "April",
          "Mei",
          "Juni",
          "Juli",
          "Agustus",
          "September",
          "Oktober",
          "November",
          "Desember",
        ];

        // 1. 1 Jan - 15 Jan
        periods.push({
          label: `1 Januari ${year} - 15 Januari ${year}`,
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 0, 15),
          monthsInvolved: [`JANUARI ${year}`],
        });

        // 2-12. 16 [M] - 15 [M+1]
        for (let m = 0; m < 11; m++) {
          const dStart = new Date(year, m, 16);
          const dEnd = new Date(year, m + 1, 15);
          const m1Name = `${MONTH_NAMES[m].toUpperCase()} ${year}`;
          const m2Name = `${MONTH_NAMES[m + 1].toUpperCase()} ${year}`;
          periods.push({
            label: `16 ${MONTH_NAMES[m]} ${year} - 15 ${MONTH_NAMES[m + 1]} ${year}`,
            startDate: dStart,
            endDate: dEnd,
            monthsInvolved: Array.from(new Set([m1Name, m2Name])),
          });
        }

        // 13. 16 Des - 31 Des
        periods.push({
          label: `16 Desember ${year} - 31 Desember ${year}`,
          startDate: new Date(year, 11, 16),
          endDate: new Date(year, 11, 31),
          monthsInvolved: [`DESEMBER ${year}`],
        });

        return periods;
      };

      const periods = generatePeriods(yearNum);
      const allMonths = Array.from(
        new Set(periods.flatMap((p) => p.monthsInvolved)),
      );

      const fetchAll = async (poli: PoliType) => {
        const promises = allMonths.map((m) =>
          patientService.getAllPatients(m, poli).catch(() => []),
        );
        const results = await Promise.all(promises);
        const map: Record<string, PatientData[]> = {};
        allMonths.forEach((m, i) => (map[m] = results[i]));
        return map;
      };

      const [umumMap, gigiMap] = await Promise.all([
        fetchAll("umum"),
        fetchAll("gigi"),
      ]);

      const rekap = periods.map((period) => {
        const calculateTotals = (data: PatientData[]) => {
          let countL = 0;
          let countP = 0;

          data.forEach((p) => {
            if (!p.TANGGAL) return;
            // Validasi baris data: Hindari baris header/subheader
            const tglStr = String(p.TANGGAL).trim().toLowerCase();
            if (tglStr === "tanggal" || tglStr === "tgl") return;

            const pDate = parseRowDate(String(p.TANGGAL));
            // Fix off-by-1 error: endDate should include the entire day
            const periodEndDateInclusive = new Date(
              period.endDate.getFullYear(),
              period.endDate.getMonth(),
              period.endDate.getDate() + 1,
            );

            if (
              !isNaN(pDate.getTime()) &&
              pDate >= period.startDate &&
              pDate < periodEndDateInclusive
            ) {
              // Validasi tambahan untuk L/P: Pastikan bukan header "L" atau "P"
              const valL = String(p.L || "").trim();
              const valP = String(p.P || "").trim();

              if (
                valL &&
                valL !== "-" &&
                valL !== "0" &&
                valL.toLowerCase() !== "l"
              )
                countL++;
              if (
                valP &&
                valP !== "-" &&
                valP !== "0" &&
                valP.toLowerCase() !== "p"
              )
                countP++;
            }
          });
          return { L: countL, P: countP, total: countL + countP };
        };

        const periodUmum = { L: 0, P: 0, total: 0 };
        const periodGigi = { L: 0, P: 0, total: 0 };

        period.monthsInvolved.forEach((m) => {
          const u = calculateTotals(umumMap[m] || []);
          const g = calculateTotals(gigiMap[m] || []);

          periodUmum.L += u.L;
          periodUmum.P += u.P;
          periodUmum.total += u.total;

          periodGigi.L += g.L;
          periodGigi.P += g.P;
          periodGigi.total += g.total;
        });

        return {
          label: period.label,
          total: periodUmum.total + periodGigi.total,
          umum: periodUmum.total,
          gigi: periodGigi.total,
        };
      });

      setPeriodicRekap(rekap);
    } catch (err) {
      console.error("Gagal memuat rekap berkala:", err);
    } finally {
      setLoadingPeriodic(false);
    }
  }, [tableYear]);

  useEffect(() => {
    fetchPeriodicRekap();
  }, [fetchPeriodicRekap]);

  // Load selected poli from localStorage saat mount
  useEffect(() => {
    const savedPoli = localStorage.getItem("dashboard_selected_poli");
    if (savedPoli && (savedPoli === "umum" || savedPoli === "gigi")) {
      setSelectedPoli(savedPoli as PoliType);
    }
    setIsStorageLoaded(true);
  }, []);

  // Save selected poli ke localStorage setiap kali berubah
  useEffect(() => {
    if (isStorageLoaded) {
      localStorage.setItem("dashboard_selected_poli", selectedPoli);
    }
  }, [selectedPoli, isStorageLoaded]);

  // Helper: Check if cell is filled (truthy, not empty string, not dash, not '0', not header)
  const isFilled = (val: unknown) => {
    if (!val) return false;
    const s = String(val).trim();
    // Exclude header values if any slipped through
    if (s.toLowerCase() === "l" || s.toLowerCase() === "p") return false;
    return s !== "" && s !== "-" && s !== "0";
  };

  const handlePoliChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPoli: PoliType | null,
  ) => {
    if (newPoli !== null) {
      setSelectedPoli(newPoli);
    }
  };

  const MONTHS = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];
  const YEARS = Array.from({ length: 4 }, (_, i) => (2025 + i).toString());

  const parseRowDate = (dateStr: string): Date => {
    if (!dateStr || dateStr === "-") return new Date("Invalid");
    const cleanStr = dateStr.trim();
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) return d;
    const parts = cleanStr.split(/[\s-/]+/);
    if (parts.length >= 3) {
      let day: number, monthIndex: number | undefined, year: number;
      if (parts[0].length === 4 && !isNaN(parseInt(parts[0]))) {
        year = parseInt(parts[0]);
        monthIndex = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        day = parseInt(parts[0]);
        const monthRaw = parts[1].toLowerCase();
        year = parseInt(parts[2]);
        if (!isNaN(parseInt(monthRaw))) {
          monthIndex = parseInt(monthRaw) - 1;
        } else {
          const monthsID: Record<string, number> = {
            januari: 0,
            februari: 1,
            maret: 2,
            april: 3,
            mei: 4,
            juni: 5,
            juli: 6,
            agustus: 7,
            september: 8,
            oktober: 9,
            november: 10,
            desember: 11,
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            jun: 5,
            jul: 6,
            ags: 7,
            sep: 8,
            okt: 9,
            nov: 10,
            des: 11,
          };
          monthIndex = monthsID[monthRaw];
        }
      }
      if (monthIndex !== undefined && !isNaN(day) && !isNaN(year)) {
        if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
          return new Date(year, monthIndex, day);
        }
      }
    }
    return new Date("Invalid");
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getAllPatients(
        periodName,
        selectedPoli,
      );

      const total = data.length;

      // Today's Date in Local Format (YYYY-MM-DD)
      const now = new Date();
      const y = now.getFullYear();
      const m = (now.getMonth() + 1).toString().padStart(2, "0");
      const d = now.getDate().toString().padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;

      const todayData = data.filter((p) => {
        if (!p.TANGGAL) return false;
        const pDateObj = parseRowDate(String(p.TANGGAL));
        if (isNaN(pDateObj.getTime())) return false;

        const pYear = pDateObj.getFullYear();
        const pMonth = (pDateObj.getMonth() + 1).toString().padStart(2, "0");
        const pDay = pDateObj.getDate().toString().padStart(2, "0");
        const pDateStr = `${pYear}-${pMonth}-${pDay}`;

        return pDateStr === todayStr;
      });

      const todayCount = todayData.length;

      let countL = 0;
      let countP = 0;
      let countBaru = 0;
      let countLama = 0;
      todayData.forEach((p) => {
        if (isFilled(p.L)) countL++;
        if (isFilled(p.P)) countP++;
        if (isFilled(p.BARU)) countBaru++;
        if (isFilled(p.LAMA)) countLama++;
      });

      setStatsData({
        totalPatients: total,
        todayPatients: todayCount,
        todayGender: { L: countL, P: countP },
        todayType: { baru: countBaru, lama: countLama },
      });
    } catch (error) {
      console.error(`Failed to fetch stats:`, error);
      setStatsData({
        totalPatients: 0,
        todayPatients: 0,
        todayGender: { L: 0, P: 0 },
        todayType: { baru: 0, lama: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPoli, periodName]);

  const fetchCombinedStats = useCallback(async () => {
    try {
      // Fetch data dari kedua poli secara paralel
      const [dataUmum, dataGigi] = await Promise.all([
        patientService.getAllPatients(periodName, "umum"),
        patientService.getAllPatients(periodName, "gigi"),
      ]);

      // Hitung total untuk Umum
      const resUmumTotal = dataUmum.length;
      let resUmumL = 0;
      let resUmumP = 0;
      dataUmum.forEach((p) => {
        if (isFilled(p.L)) resUmumL++;
        if (isFilled(p.P)) resUmumP++;
      });

      // Hitung total untuk Gigi
      const resGigiTotal = dataGigi.length;
      let resGigiL = 0;
      let resGigiP = 0;
      dataGigi.forEach((p) => {
        if (isFilled(p.L)) resGigiL++;
        if (isFilled(p.P)) resGigiP++;
      });

      setCombinedStats({
        totalBothPoli: resUmumTotal + resGigiTotal,
        totalL: resUmumL + resGigiL,
        totalP: resUmumP + resGigiP,
        totalBaru:
          dataUmum.filter((p) => isFilled(p.BARU)).length +
          dataGigi.filter((p) => isFilled(p.BARU)).length,
        totalLama:
          dataUmum.filter((p) => isFilled(p.LAMA)).length +
          dataGigi.filter((p) => isFilled(p.LAMA)).length,
        periodTotals: {
          umum: {
            total: resUmumTotal,
            L: resUmumL,
            P: resUmumP,
            baru: dataUmum.filter((p) => isFilled(p.BARU)).length,
            lama: dataUmum.filter((p) => isFilled(p.LAMA)).length,
          },
          gigi: {
            total: resGigiTotal,
            L: resGigiL,
            P: resGigiP,
            baru: dataGigi.filter((p) => isFilled(p.BARU)).length,
            lama: dataGigi.filter((p) => isFilled(p.LAMA)).length,
          },
        },
      });
    } catch (error) {
      console.error("Failed to fetch combined stats:", error);
      setCombinedStats({
        totalBothPoli: 0,
        totalL: 0,
        totalP: 0,
        totalBaru: 0,
        totalLama: 0,
        periodTotals: {
          umum: { total: 0, L: 0, P: 0, baru: 0, lama: 0 },
          gigi: { total: 0, L: 0, P: 0, baru: 0, lama: 0 },
        },
      });
    }
  }, [periodName]);

  useEffect(() => {
    if (isStorageLoaded) {
      fetchStats();
      fetchCombinedStats();
    }
  }, [fetchStats, fetchCombinedStats, isStorageLoaded]);

  // Handler untuk export dashboard ke Excel
  const handleExportToExcel = () => {
    if (!isSuperAdmin && !isAdmin) {
      alert("Anda tidak memiliki akses untuk export data");
      return;
    }

    exportDashboardToExcel({
      month: selectedMonth,
      year: selectedYear,
      totalPatients: statsData.totalPatients,
      todayPatients: statsData.todayPatients,
      todayGender: statsData.todayGender,
      todayType: statsData.todayType,
      combinedStats: combinedStats,
      topDiagnosis: topDiagnosisData,
      periodicRekap: periodicRekap,
      selectedPoli: selectedPoli,
    });
  };

  // Callback untuk menerima data diagnosis dari TopDiagnosisChart
  const handleDiagnosisDataReady = useCallback(
    (data: Array<{ name: string; count: number }>) => {
      setTopDiagnosisData(data);
    },
    [],
  );

  const stats = [
    {
      title: `Total Pasien (${selectedPoli === "gigi" ? "Gigi" : "Umum"})`,
      value: loading ? "..." : statsData.totalPatients.toLocaleString(),
      icon: <PeopleIcon sx={{ fontSize: 28, color: "white" }} />,
      gradient:
        selectedPoli === "gigi"
          ? "linear-gradient(135deg, #F472B6 0%, #DB2777 100%)"
          : "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)",
      trend: `Bulan ${periodName}`,
      trendColor: selectedPoli === "gigi" ? "#DB2777" : "#4F46E5",
      trendBg:
        selectedPoli === "gigi"
          ? "rgba(244, 114, 182, 0.15)"
          : "rgba(129, 140, 248, 0.15)",
    },
    {
      title: "Kunjungan Hari Ini",
      value: loading ? "..." : statsData.todayPatients.toLocaleString(),
      icon: <AssignmentIcon sx={{ fontSize: 28, color: "white" }} />,
      gradient: "linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)",
      trend: "Real-time WIB",
      trendColor: "#0D9488",
      trendBg: "rgba(45, 212, 191, 0.15)",
    },
    {
      title: "Rasio Gender (L | P)",
      value: loading
        ? "..."
        : `${statsData.todayGender.L} L | ${statsData.todayGender.P} P`,
      icon: <WcIcon sx={{ fontSize: 28, color: "white" }} />,
      gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
      trend: "Update Hari Ini",
      trendColor: "#059669",
      trendBg: "rgba(52, 211, 153, 0.15)",
    },
    {
      title: "Tipe Pasien",
      value: loading
        ? "..."
        : `${statsData.todayType.baru} Baru | ${statsData.todayType.lama} Lama`,
      icon: <AssignmentIcon sx={{ fontSize: 28, color: "white" }} />,
      gradient: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
      trend: "Pasien Hari Ini",
      trendColor: "#4338CA",
      trendBg: "rgba(99, 102, 241, 0.15)",
    },
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        flexWrap="wrap"
        gap={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{ mb: 0.5, color: "#1E293B", letterSpacing: "-0.02em" }}
          >
            Dashboard Overview
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            Laporan data real-time pasien poli{" "}
            <Box
              component="span"
              sx={{ color: "primary.main", fontWeight: 700 }}
            >
              {selectedPoli.toUpperCase()}
            </Box>
            {"."}
          </Typography>
        </Box>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Paper
            elevation={0}
            sx={{
              p: 0.5,
              borderRadius: "12px",
              bgcolor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              display: "flex",
              gap: 1,
            }}
          >
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
              sx={{
                borderRadius: "8px",
                bgcolor: "white",
                minWidth: 130,
                "& fieldset": { border: "none" },
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              size="small"
              sx={{
                borderRadius: "8px",
                bgcolor: "white",
                minWidth: 90,
                "& fieldset": { border: "none" },
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 0.5,
              borderRadius: "12px",
              bgcolor: "#F1F5F9",
              border: "1px solid #E2E8F0",
            }}
          >
            <ToggleButtonGroup
              value={selectedPoli}
              exclusive
              onChange={handlePoliChange}
              aria-label="Pilih Poli"
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: 2,
                  py: 1,
                  borderRadius: "8px !important",
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#64748B",
                  "&.Mui-selected": {
                    bgcolor: "white",
                    color: "primary.main",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    "&:hover": { bgcolor: "white" },
                  },
                },
              }}
            >
              <ToggleButton value="umum">
                <PeopleIcon sx={{ mr: 1, fontSize: 18 }} />
                Poli Umum
              </ToggleButton>
              <ToggleButton value="gigi">
                <MedicalServicesIcon sx={{ mr: 1, fontSize: 18 }} />
                Poli Gigi
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {(isSuperAdmin || isAdmin) && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportToExcel}
              disabled={loading || loadingPeriodic}
              sx={{
                borderRadius: "12px",
                px: 2,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)",
                },
                "&:disabled": {
                  background: "#E2E8F0",
                  color: "#94A3B8",
                },
              }}
            >
              Export Excel
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 5,
        }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            sx={{
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid #F1F5F9",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "visible",
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: "0 12px 30px rgba(79, 70, 229, 0.08)",
                borderColor: "#E2E8F0",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    background: stat.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 16px -4px rgba(0,0,0,0.15)",
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="600"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 0.2,
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: "6px",
                        bgcolor: stat.trendBg,
                        color: stat.trendColor,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {stat.trend}
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Typography
                variant="h3"
                fontWeight="800"
                sx={{
                  color: "#0F172A",
                  mb: 0.5,
                  fontSize: stat.value.length > 10 ? "1.75rem" : "2.25rem",
                }}
              >
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Main Analysis Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "2.5fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Left Col: Chart & Actions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "24px",
              border: "1px solid #F1F5F9",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <TopDiagnosisChart
              poliType={selectedPoli}
              targetMonth={selectedMonth}
              targetYear={selectedYear}
              onDataReady={handleDiagnosisDataReady}
            />
          </Paper>
        </Box>

        {/* Right Col: Container Status & Akses Cepat */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "24px",
              border: "1px solid #F1F5F9",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Status Sistem Section */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="800"
                color="#64748B"
                sx={{ textTransform: "uppercase", mb: 2, letterSpacing: 1 }}
              >
                Status Sistem
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#F0FDF4",
                    borderRadius: "16px",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <Typography variant="body2" fontWeight="700" color="#166534">
                    Backend Connected
                  </Typography>
                  <Typography variant="caption" color="#15803D">
                    Google Sheets API V5 active
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#F8FAFC",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="body2" fontWeight="700" color="primary">
                    Waktu Server
                  </Typography>
                  <Typography variant="caption" color="#64748B">
                    {serverTime || "..."} WIB
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Akses Cepat Section */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="800"
                color="#64748B"
                sx={{ textTransform: "uppercase", mb: 2, letterSpacing: 1 }}
              >
                Akses Cepat
              </Typography>
              <Box
                component={Link}
                href="/dashboard/patients"
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: "#696CFF",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "#5F61E6",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 15px rgba(105, 108, 255, 0.25)",
                  },
                }}
              >
                <Box display="flex" gap={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      color="white"
                    >
                      Kelola Pasien
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Input & Edit Data
                    </Typography>
                  </Box>
                </Box>
                <ArrowForwardIcon sx={{ color: "white", fontSize: 18 }} />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Ringkasan Gabungan (Umum & Gigi) */}
      {/* Ringkasan Gabungan (Umum & Gigi) */}
      <Paper
        elevation={0}
        sx={{
          mb: 5,
          mt: 4, // Added spacing from top sections
          p: 3,
          borderRadius: "24px",
          border: "1px solid #F1F5F9",
          bgcolor: "white", // Changed to white
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)", // Added shadow
        }}
      >
        <Typography
          variant="h6"
          fontWeight="800"
          sx={{ mb: 2.5, color: "#1E293B", letterSpacing: "-0.01em" }}
        >
          Ringkasan Gabungan (Umum & Gigi)
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {/* Card: Total Akumulasi Gabungan */}
          <Card
            sx={{
              borderRadius: "24px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "white",
              boxShadow: "0 10px 25px rgba(79, 70, 229, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                opacity: 0.2,
              }}
            >
              <PeopleIcon sx={{ fontSize: 160 }} />
            </Box>
            <CardContent sx={{ p: 3.5 }}>
              <Typography
                variant="overline"
                sx={{ opacity: 0.8, letterSpacing: 2, fontWeight: 700 }}
              >
                Total Akumulasi Pasien
              </Typography>
              <Typography variant="h2" fontWeight="900" sx={{ mt: 1, mb: 2 }}>
                {loading ? "..." : combinedStats.totalBothPoli.toLocaleString()}
              </Typography>
              <Box display="flex" gap={2}>
                <Box
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    px: 2,
                    py: 1,
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Typography variant="body2" fontWeight="700" color="white">
                    L: {combinedStats.totalL}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    px: 2,
                    py: 1,
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Typography variant="body2" fontWeight="700" color="white">
                    P: {combinedStats.totalP}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card: Perincian Per Periode (Bulan Ini) */}
          {/* Card: Tipe Pasien (Baru & Lama) - Reverted to Original List Style */}
          <Card
            sx={{
              borderRadius: "24px",
              border: "1px solid #E2E8F0",
              bgcolor: "white",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="800"
                  color="#1E293B"
                >
                  Tipe Pasien: {periodName}
                </Typography>
                <Box
                  sx={{
                    background:
                      "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)",
                    color: "white",
                    px: 2,
                    py: 0.5,
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  {loading
                    ? "..."
                    : (combinedStats.totalBaru || 0) +
                      (combinedStats.totalLama || 0)}{" "}
                  TOTAL
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* Poli Umum */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#4F46E5",
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="700"
                      color="#475569"
                    >
                      Poli Umum
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="body2"
                      fontWeight="800"
                      color="#1E293B"
                    >
                      {loading
                        ? "..."
                        : combinedStats.periodTotals.umum.baru +
                          combinedStats.periodTotals.umum.lama}{" "}
                      Pasien
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="600"
                    >
                      Baru: {combinedStats.periodTotals.umum.baru} | Lama:{" "}
                      {combinedStats.periodTotals.umum.lama}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderStyle: "dashed" }} />

                {/* Poli Gigi */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#DB2777",
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="700"
                      color="#475569"
                    >
                      Poli Gigi
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="body2"
                      fontWeight="800"
                      color="#1E293B"
                    >
                      {loading
                        ? "..."
                        : combinedStats.periodTotals.gigi.baru +
                          combinedStats.periodTotals.gigi.lama}{" "}
                      Pasien
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="600"
                    >
                      Baru: {combinedStats.periodTotals.gigi.baru} | Lama:{" "}
                      {combinedStats.periodTotals.gigi.lama}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ height: "1px", bgcolor: "#F1F5F9", my: 2.5 }} />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="600"
                >
                  Total Periode Ini
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="900"
                  color="primary.main"
                >
                  {loading
                    ? "..."
                    : combinedStats.periodTotals.umum.total +
                      combinedStats.periodTotals.gigi.total}{" "}
                  Pasien
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Full Width Table Section: Rekap Total Kunjungan Per Periode */}
      <Paper
        elevation={0}
        sx={{
          mb: 5,
          p: 3,
          borderRadius: "24px",
          border: "1px solid #F1F5F9",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <EventNoteIcon sx={{ color: "primary.main", fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="800" color="#1E293B">
                Rekap Total Kunjungan Pasien per Periode {tableYear}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Akumulasi data kunjungan Poli Umum dan Poli Gigi per Periode
              </Typography>
            </Box>
          </Box>

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="table-year-select-label">Pilih Tahun</InputLabel>
            <Select
              labelId="table-year-select-label"
              value={tableYear}
              label="Pilih Tahun"
              onChange={(e) => setTableYear(e.target.value)}
              sx={{
                borderRadius: "12px",
                bgcolor: "white",
                "& .MuiSelect-select": { py: 1.5 },
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: "#475569",
                    fontSize: "0.90rem",
                    width: "30%", // Reduced width
                  }}
                >
                  PERIODE
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 800,
                    color: "#4F46E5",
                    fontSize: "0.90rem",
                  }}
                >
                  TOTAL GABUNGAN
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 800,
                    color: "#0D9488",
                    fontSize: "0.90rem",
                  }}
                >
                  POLI UMUM
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 800,
                    color: "#DB2777",
                    fontSize: "0.90rem",
                  }}
                >
                  POLI GIGI
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingPeriodic ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Menghitung Data Tahunan...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : periodicRekap.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Tidak ada data untuk ditampilkan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                periodicRekap.map((row, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: "#334155" }}>
                      {row.label}
                    </TableCell>
                    <TableCell align="center">
                      <MuiChip
                        label={`${row.total} Pasien`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: "#EEF2FF",
                          color: "#4F46E5",
                        }}
                      />
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "#0D9488" }}
                    >
                      {row.umum}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "#DB2777" }}
                    >
                      {row.gigi}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {periodicRekap.length > 0 && (
              <TableFooter>
                <TableRow
                  sx={{ bgcolor: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "#1E293B",
                      fontSize: "15px",
                      py: 2,
                    }}
                  >
                    TOTAL TAHUN {tableYear}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "inline-block",
                        fontWeight: 900,
                        bgcolor: "#1E293B",
                        color: "#fff",
                        px: 2,
                        py: 0.5,
                        borderRadius: "99px",
                        fontSize: "15px",
                        boxShadow: "0 2px 6px rgba(30, 41, 59, 0.2)",
                      }}
                    >
                      {periodicRekap
                        .reduce((a, b) => a + b.total, 0)
                        .toLocaleString()}{" "}
                      Pasien
                    </Box>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 800,
                      color: "#0D9488",
                      fontSize: "`5px",
                    }}
                  >
                    {periodicRekap
                      .reduce((a, b) => a + b.umum, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 800,
                      color: "#DB2777",
                      fontSize: "15px",
                    }}
                  >
                    {periodicRekap
                      .reduce((a, b) => a + b.gigi, 0)
                      .toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

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
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WcIcon from "@mui/icons-material/Wc";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import TopDiagnosisChart from "@/components/Dashboard/TopDiagnosisChart";
import { patientService, PoliType } from "@/services/patientService";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [selectedPoli, setSelectedPoli] = useState<PoliType>("umum");
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayPatients: 0,
    todayGender: { L: 0, P: 0 },
  });

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

  // Helper: Check if cell is filled (truthy, not empty string, not dash)
  const isFilled = (val: unknown) => {
    if (!val) return false;
    const s = String(val).trim();
    return s !== "" && s !== "-" && s !== "0";
  };

  // Helper: Get Current Month Name (Indonesia)
  const getCurrentMonthName = () => {
    const date = new Date();
    const month = date.toLocaleDateString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${month.toUpperCase()} ${year}`;
  };

  const currentMonthName = getCurrentMonthName();

  const handlePoliChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPoli: PoliType | null
  ) => {
    if (newPoli !== null) {
      setSelectedPoli(newPoli);
    }
  };

  // Helper: Convert "DD MMM YYYY" (Indonesian) to "YYYY-MM-DD"
  const parseDateFromSheet = (displayDate: string): string => {
    if (!displayDate) return "";
    const cleanDate = displayDate.trim();

    // Already ISO?
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) return cleanDate;

    const MONTH_MAP: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      mei: "05",
      jun: "06",
      jul: "07",
      agu: "08",
      sep: "09",
      okt: "10",
      nov: "11",
      des: "12",
      januari: "01",
      februari: "02",
      maret: "03",
      april: "04",
      agustus: "08",
      september: "09",
      oktober: "10",
      november: "11",
      desember: "12",
    };

    try {
      const parts = cleanDate.split(/\s+/);
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, "0");
        const monthStr = parts[1].toLowerCase();
        const year = parts[2];
        let month = MONTH_MAP[monthStr];

        if (!month) {
          const key = Object.keys(MONTH_MAP).find(
            (k) => k.startsWith(monthStr) || monthStr.startsWith(k)
          );
          if (key) month = MONTH_MAP[key];
        }

        if (month && year.length === 4) {
          return `${year}-${month}-${day}`;
        }
      }
      return "";
    } catch {
      return "";
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getAllPatients(
        currentMonthName,
        selectedPoli
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
        const pDate = parseDateFromSheet(p.TANGGAL);
        return pDate === todayStr;
      });

      const todayCount = todayData.length;

      let countL = 0;
      let countP = 0;
      todayData.forEach((p) => {
        if (isFilled(p.L)) countL++;
        if (isFilled(p.P)) countP++;
      });

      setStatsData({
        totalPatients: total,
        todayPatients: todayCount,
        todayGender: { L: countL, P: countP },
      });
    } catch (error) {
      console.error(`Failed to fetch stats:`, error);
      setStatsData({
        totalPatients: 0,
        todayPatients: 0,
        todayGender: { L: 0, P: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPoli, currentMonthName]);

  useEffect(() => {
    // Hanya fetch data setelah localStorage selesai di-load
    if (isStorageLoaded) {
      fetchStats();
    }
  }, [fetchStats, isStorageLoaded]);

  const stats = [
    {
      title: `Total Pasien (${selectedPoli === "gigi" ? "Gigi" : "Umum"})`,
      value: loading ? "..." : statsData.totalPatients.toLocaleString(),
      icon: <PeopleIcon sx={{ fontSize: 28, color: "white" }} />,
      gradient:
        selectedPoli === "gigi"
          ? "linear-gradient(135deg, #F472B6 0%, #DB2777 100%)"
          : "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)",
      trend: `Bulan ${currentMonthName}`,
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
  ];

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
            <TopDiagnosisChart poliType={selectedPoli} />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "24px",
              border: "1px solid #F1F5F9",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Box>
                <Typography variant="h6" fontWeight="800" color="#1E293B">
                  Akses Cepat Tindakan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pusat pengelolaan data poli {selectedPoli}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box
                component={Link}
                href={`/dashboard/patients`}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #F1F5F9",
                  bgcolor: "#F8FAFC",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    bgcolor: "white",
                    borderColor: "primary.main",
                    transform: "scale(1.02)",
                    boxShadow: "0 10px 20px -5px rgba(79,70,229,0.12)",
                    "& .arrow": {
                      color: "primary.main",
                      transform: "translateX(4px)",
                    },
                  },
                }}
              >
                <Box display="flex" gap={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      color: "primary.main",
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="700"
                      color="#1E293B"
                    >
                      Kelola Data Pasien
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Input & Edit Pasien {selectedPoli}
                    </Typography>
                  </Box>
                </Box>
                <ArrowForwardIcon
                  className="arrow"
                  sx={{ fontSize: 20, transition: "0.2s", color: "#94A3B8" }}
                />
              </Box>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px dashed #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#F8FAFC",
                }}
              >
                <Typography
                  variant="body2"
                  color="#94A3B8"
                  sx={{ fontStyle: "italic" }}
                >
                  Fitur Lainnya Segera Hadir
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Col: System Status */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "24px",
            border: "1px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            height: "100%",
            display: { xs: "none", xl: "flex" },
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="800"
            color="#64748B"
            sx={{ textTransform: "uppercase" }}
          >
            Status Sistem
          </Typography>
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
              Google Sheets API V5 is active
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
              {new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              WIB
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

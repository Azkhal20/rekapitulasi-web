"use client";

import { useEffect, useState } from "react";
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
  const [selectedPoli, setSelectedPoli] = useState<PoliType>("umum");
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayPatients: 0,
    todayGender: { L: 0, P: 0 },
  });

  // Helper: Check if cell is filled (truthy, not empty string, not dash)
  const isFilled = (val: any) => {
    if (!val) return false;
    const s = val.toString().trim();
    return s !== "" && s !== "-" && s !== "0";
  };

  // Helper: Get Current Month Name (Indonesia)
  const getCurrentMonthName = () => {
    const date = new Date();
    const month = date.toLocaleDateString("id-ID", { month: "long" });
    return month.toUpperCase();
  };

  const currentMonthName = getCurrentMonthName();

  const handlePoliChange = (
    event: React.MouseEvent<HTMLElement>,
    newPoli: PoliType | null
  ) => {
    if (newPoli !== null) {
      setSelectedPoli(newPoli);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAllPatients(
          currentMonthName,
          selectedPoli
        );

        // Calculate Stats
        const total = data.length;

        // Today's Patients
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

        const parseDate = (d: string) => {
          if (d.includes("-") && d.length === 10) return d;
          try {
            const dateObj = new Date(d);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split("T")[0];
            }
          } catch (e) {
            return "";
          }
          return "";
        };

        const todayData = data.filter((p) => {
          if (!p.TANGGAL) return false;
          const pDate = parseDate(p.TANGGAL);
          return pDate === todayStr;
        });

        const todayCount = todayData.length;

        // Calculate Today's Gender
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
        console.error(
          `Failed to fetch dashboard stats for ${selectedPoli}`,
          error
        );
        setStatsData({
          totalPatients: 0,
          todayPatients: 0,
          todayGender: { L: 0, P: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPoli, currentMonthName]);

  const stats = [
    {
      title: `Total Pasien (${selectedPoli === "gigi" ? "Gigi" : "Umum"})`,
      value: loading ? "..." : statsData.totalPatients.toLocaleString(),
      icon: <PeopleIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient:
        selectedPoli === "gigi"
          ? "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)"
          : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      trend: `Bulan ${currentMonthName}`,
      trendColor: selectedPoli === "gigi" ? "#DB2777" : "#4F46E5",
      trendBg:
        selectedPoli === "gigi"
          ? "rgba(236, 72, 153, 0.1)"
          : "rgba(79, 70, 229, 0.1)",
    },
    {
      title: "Kunjungan Hari Ini",
      value: loading ? "..." : statsData.todayPatients.toLocaleString(),
      icon: <AssignmentIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
      trend: "Update Harian",
      trendColor: "#0D9488",
      trendBg: "rgba(20, 184, 166, 0.1)",
    },
    {
      title: "Laki-laki vs Perempuan",
      value: loading
        ? "..."
        : `L: ${statsData.todayGender.L} | P: ${statsData.todayGender.P}`,
      icon: <WcIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      trend: "Hari Ini", // Changed to Daily
      trendColor: "#059669",
      trendBg: "rgba(16, 185, 129, 0.1)",
    },
  ];

  return (
    <Box>
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography
            variant="h1"
            fontWeight="bold"
            fontSize={34}
            sx={{ mb: 1, color: "#111827" }}
          >
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pantau rekapitulasi data pasien secara real-time
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={selectedPoli}
          exclusive
          onChange={handlePoliChange}
          aria-label="Pilih Poli"
          size="small"
        >
          <ToggleButton value="umum" aria-label="Poli Umum">
            <PeopleIcon sx={{ mr: 1 }} fontSize="small" />
            Poli Umum
          </ToggleButton>
          <ToggleButton value="gigi" aria-label="Poli Gigi">
            <MedicalServicesIcon sx={{ mr: 1 }} fontSize="small" />
            Poli Gigi
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Statistics Cards - Back to 3 Columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            sx={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "16px",
                    background: stat.gradient,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ mb: 0.5, color: "#111827" }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                fontWeight="500"
              >
                {stat.title}
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  bgcolor: stat.trendBg,
                  color: stat.trendColor,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {stat.trend}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Quick Access Section */}
      <Paper sx={{ p: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: "#374151" }}
              gutterBottom
            >
              Pusat Tindakan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Akses cepat ke menu{" "}
              {selectedPoli === "gigi" ? "Poli Gigi" : "Poli Umum"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          <Box
            component={Link}
            href={`/dashboard/poli/${selectedPoli}`}
            sx={{
              p: 3,
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              textDecoration: "none",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "#F9FAFB",
                borderColor: "#6366F1",
                transform: "translateY(-2px)",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" gap={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: selectedPoli === "gigi" ? "#FCE7F3" : "#E0E7FF",
                    color: selectedPoli === "gigi" ? "#DB2777" : "#4F46E5",
                  }}
                >
                  {selectedPoli === "gigi" ? (
                    <MedicalServicesIcon />
                  ) : (
                    <PeopleIcon />
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" color="text.primary">
                    Data Pasien {selectedPoli === "gigi" ? "Gigi" : "Umum"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kelola data pasien poli {selectedPoli}
                  </Typography>
                </Box>
              </Box>
              <ArrowForwardIcon color="action" />
            </Box>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: "16px",
              border: "1px dashed #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#F9FAFB",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Fitur Poli {selectedPoli === "gigi" ? "Gigi" : "Umum"} lainnya
              segera hadir
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Top Diagnosis Chart Section */}
      <TopDiagnosisChart poliType={selectedPoli} />
    </Box>
  );
}

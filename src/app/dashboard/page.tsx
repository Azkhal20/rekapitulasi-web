"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WcIcon from "@mui/icons-material/Wc"; // Icon Gender
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import { patientService, PatientData } from "@/services/patientService";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayPatients: 0,
    genderRatio: { L: 0, P: 0 },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Default fetching from NOVEMBER as per user preference
        const data = await patientService.getAllPatients("NOVEMBER");

        // Calculate Stats
        const total = data.length;

        // Today's Patients
        const today = new Date();
        // Reset time to verify date strictly
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

        // Helper to normalize sheet date "16 Des 2025" to "2025-12-16"
        const parseDate = (d: string) => {
          // If already YYYY-MM-DD
          if (d.includes("-") && d.length === 10) return d;

          // If Indonesian format "16 Des 2025" or similar
          try {
            // Basic check - if we can construct a date object
            const dateObj = new Date(d);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split("T")[0];
            }
          } catch (e) {
            return "";
          }
          return "";
        };

        const todayCount = data.filter((p) => {
          if (!p.TANGGAL) return false;
          // Check if backend returns ISO or formatted.
          // It typically returns "16 Des 2025" if display value used, or "2025-12-16" if raw.
          // Let's maximize match chance.
          const pDate = parseDate(p.TANGGAL);
          return pDate === todayStr;
        }).length;

        // Gender Ratio
        let countL = 0;
        let countP = 0;
        data.forEach((p) => {
          const l = (p.L || "").toString().trim();
          const valP = (p.P || "").toString().trim();

          // Check if column L has "1" or "v" or anything truthy
          if (l === "1" || l.toLowerCase() === "v" || l.toLowerCase() === "l")
            countL++;
          // Check if column P has "1" or "v"
          if (
            valP === "1" ||
            valP.toLowerCase() === "v" ||
            valP.toLowerCase() === "p"
          )
            countP++;
        });

        setStatsData({
          totalPatients: total,
          todayPatients: todayCount,
          genderRatio: { L: countL, P: countP },
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      title: "Total Pasien (November)",
      value: loading ? "..." : statsData.totalPatients.toLocaleString(),
      icon: <PeopleIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      trend: "Data Realtime",
      trendColor: "#4F46E5",
      trendBg: "rgba(79, 70, 229, 0.1)",
    },
    {
      title: "Kunjungan Hari Ini",
      value: loading ? "..." : statsData.todayPatients.toLocaleString(),
      icon: <AssignmentIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
      trend: "Update Harian",
      trendColor: "#DB2777",
      trendBg: "rgba(236, 72, 153, 0.1)",
    },
    {
      title: "Laki-laki vs Perempuan",
      value: loading
        ? "..."
        : `L: ${statsData.genderRatio.L} | P: ${statsData.genderRatio.P}`,
      icon: <WcIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      trend: "Demografi",
      trendColor: "#059669",
      trendBg: "rgba(16, 185, 129, 0.1)",
    },
  ];

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 1, color: "#111827" }}
        >
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pantau rekapitulasi data pasien secara real-time
        </Typography>
      </Box>

      {/* Statistics Cards */}
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
                {/* Visual loading indicator for individual cards if needed, or just text */}
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
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Pusat Tindakan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Akses cepat ke fitur-fitur penting
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
            href="/dashboard/patients"
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
                    bgcolor: "#E0E7FF",
                    color: "#4F46E5",
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="h6" color="text.primary">
                    Data Pasien
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lihat dan kelola data pasien
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
              Fitur lainnya akan segera hadir
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

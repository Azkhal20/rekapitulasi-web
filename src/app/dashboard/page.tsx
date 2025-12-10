"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Pasien",
      value: "1,248",
      icon: <PeopleIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      trend: "+12% dari bulan lalu",
    },
    {
      title: "Data Harian",
      value: "45",
      icon: <AssignmentIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
      trend: "+5% dari kemarin",
    },
    {
      title: "Tingkat Akurasi",
      value: "99.8%",
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: "white" }} />,
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      trend: "Optimal",
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
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
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
                  bgcolor: "rgba(16, 185, 129, 0.1)",
                  color: "#059669",
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
            <Typography variant="body2" color="text.secondary">
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
            <Typography variant="body2" color="text.secondary">
              Fitur lainnya akan segera hadir
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

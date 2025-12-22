"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Stack,
  Divider,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";
import { patientService, PoliType } from "@/services/patientService";

const MONTHS = [
  "NOVEMBER",
  "DESEMBER",
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
];

// Helper to get current month name in Uppercase Indonesia
const getCurrentMonthName = () => {
  const date = new Date();
  const month = date.toLocaleDateString("id-ID", { month: "long" });
  return month.toUpperCase();
};

interface TopDiagnosisChartProps {
  poliType: PoliType;
}

export default function TopDiagnosisChart({
  poliType,
}: TopDiagnosisChartProps) {
  const theme = useTheme();
  // Default to current month dynamically
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName());

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; count: number }[]>(
    []
  );
  const [genderStats, setGenderStats] = useState({ L: 0, P: 0 });

  // Coloring based on Poli
  const barColor = poliType === "gigi" ? "#EC4899" : "#4F46E5"; // Pink vs Indigo

  // Logic to check if cell is filled (truthy, not empty string, not dash)
  const isFilled = (val: any) => {
    if (!val) return false;
    const s = val.toString().trim();
    return s !== "" && s !== "-" && s !== "0";
  };

  // Helper to truncate long text
  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch ALL data for the month
        const patients = await patientService.getAllPatients(
          selectedMonth,
          poliType
        );

        // 1. Aggregate Diagnosis
        const diagnosisCounts: Record<string, number> = {};

        // 2. Count Gender
        let countL = 0;
        let countP = 0;

        patients.forEach((p) => {
          // Diagnosis
          let diag = p.DIAGNOSIS || p.DIAGNOSIS;
          if (diag && diag !== "-" && diag.trim() !== "") {
            diag = diag.trim().toUpperCase();
            diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
          }

          // Gender - Looser check
          if (isFilled(p.L)) countL++;
          if (isFilled(p.P)) countP++;
        });

        // Convert Diagnosis to array and sort
        const sortedData = Object.entries(diagnosisCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Take Top 10

        setChartData(sortedData);
        setGenderStats({ L: countL, P: countP });
      } catch (error) {
        console.error("Failed to fetch data for chart", error);
        setChartData([]);
        setGenderStats({ L: 0, P: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, poliType]);

  // Custom Tooltip for Bar Chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 1.5,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            boxShadow: 2,
            maxWidth: 300,
            zIndex: 9999,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: barColor }}>
            Jumlah: {payload[0].value} Pasien
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
        mt: 3,
        width: "100%",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: "#374151" }}
            >
              Analisis Data Bulanan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Statistik Poli {poliType === "gigi" ? "Gigi" : "Umum"} - Bulan{" "}
              {selectedMonth}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{
                borderRadius: 2,
                bgcolor: "#F9FAFB",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E5E7EB",
                },
                fontWeight: 600,
              }}
            >
              {MONTHS.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={350}
          >
            <CircularProgress sx={{ color: barColor }} />
          </Box>
        ) : (
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={4}
            width="100%"
          >
            {/* LEFT: Top 10 Diagnosis (Bar Chart) - FLEX GROW to fill space */}
            <Box flex={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 2 }}
              >
                10 Diagnosis Terbanyak
              </Typography>

              {chartData.length === 0 ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height={300}
                  bgcolor="#F9FAFB"
                  borderRadius={2}
                >
                  <Typography color="text.secondary">
                    Belum ada data diagnosis
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        tickFormatter={(val) => truncateText(val, 25)}
                        interval={0}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1500}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={barColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>

            {/* RIGHT: Gender Ratio (Demografi) - FIXED WIDTH on desktop */}
            <Box width={{ xs: "100%", md: "320px" }} flexShrink={0}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 2 }}
              >
                Demografi Pasien
              </Typography>

              <Box
                sx={{
                  p: 3,
                  bgcolor: "#F9FAFB",
                  borderRadius: 3,
                  border: "1px dashed #E5E7EB",
                  height: "350px", // Match chart height
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {/* Gender Stats */}
                <Stack spacing={3}>
                  {/* Laki-laki */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "#E0F2FE",
                          borderRadius: "12px",
                          color: "#0EA5E9",
                        }}
                      >
                        <ManIcon />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Laki-laki
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="#0EA5E9"
                        >
                          {genderStats.L}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      {genderStats.L + genderStats.P > 0
                        ? Math.round(
                            (genderStats.L / (genderStats.L + genderStats.P)) *
                              100
                          )
                        : 0}
                      %
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Perempuan */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "#FCE7F3",
                          borderRadius: "12px",
                          color: "#EC4899",
                        }}
                      >
                        <WomanIcon />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Perempuan
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="#EC4899"
                        >
                          {genderStats.P}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      {genderStats.L + genderStats.P > 0
                        ? Math.round(
                            (genderStats.P / (genderStats.L + genderStats.P)) *
                              100
                          )
                        : 0}
                      %
                    </Typography>
                  </Box>

                  {/* Total Info */}
                  <Box
                    sx={{
                      mt: 2,
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "white",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      TOTAL PASIEN BULAN INI
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      {(genderStats.L + genderStats.P).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Divider } from "@mui/material";
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

// Custom constants can be added here if needed

interface TopDiagnosisChartProps {
  poliType: PoliType;
  targetMonth: string;
  targetYear: string;
  onDataReady?: (data: Array<{ name: string; count: number }>) => void;
}

export default function TopDiagnosisChart({
  poliType,
  targetMonth,
  targetYear,
  onDataReady,
}: TopDiagnosisChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; count: number }[]>(
    [],
  );
  const [genderStats, setGenderStats] = useState({ L: 0, P: 0 });

  // Coloring based on Poli
  const barColor = poliType === "gigi" ? "#EC4899" : "#4F46E5"; // Pink vs Indigo

  // Logic to check if cell is filled (truthy, not empty string, not dash)
  const isFilled = (val: unknown) => {
    if (!val) return false;
    const s = String(val).trim();
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
        // Fetch ALL data for the month + year
        const sheetName = `${targetMonth} ${targetYear}`;
        const patients = await patientService.getAllPatients(
          sheetName,
          poliType,
        );

        // 1. Aggregate Diagnosis
        const diagnosisCounts: Record<string, number> = {};

        // 2. Count Gender
        let countL = 0;
        let countP = 0;

        patients.forEach((p) => {
          // Diagnosis - Improved multi-entry parsing
          const rawDiag = p.DIAGNOSIS || "";
          if (rawDiag.trim() !== "" && rawDiag !== "-") {
            // 1. Split by numbering pattern (e.g., "1. Diag1 2. Diag2") or newline
            // This handles "1. Text \n 2. Text" or "1. Text 2. Text"
            const parts = rawDiag
              .split(/\d+\.\s+/)
              .map((part) => part.trim())
              .filter((part) => part !== "");

            parts.forEach((part) => {
              // 2. Clean data: Split by "." to remove tooth numbers/extra info
              // e.g., "Gangren pulpa.18" -> "Gangren pulpa"
              let cleanName = part.split(".")[0].trim();

              // Extra cleanup: remove trailing numbers or simple tooth codes
              // if they didn't use a dot (e.g., "Gangren pulpa 18")
              // But strictly follow user's "." suggestion first
              if (cleanName) {
                cleanName = cleanName.toUpperCase();
                diagnosisCounts[cleanName] =
                  (diagnosisCounts[cleanName] || 0) + 1;
              }
            });
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

        // Send data back to parent for export
        if (onDataReady) {
          onDataReady(sortedData);
        }
      } catch (error) {
        console.error("Failed to fetch data for chart", error);
        setChartData([]);
        setGenderStats({ L: 0, P: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetMonth, targetYear, poliType, onDataReady]);

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
    <Box sx={{ width: "100%" }}>
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
            variant="h5"
            fontWeight="800"
            sx={{ color: "#1E293B", letterSpacing: "-0.02em" }}
          >
            Analisis Data Bulanan
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            Statistik Poli {poliType.toUpperCase()} — {targetMonth} {targetYear}
          </Typography>
        </Box>

        {/* Removed month/year selection as it's now controlled by props */}
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={400}
        >
          <CircularProgress size={32} sx={{ color: barColor }} />
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection={{ xs: "column", lg: "row" }}
          gap={5}
          width="100%"
        >
          {/* LEFT: Top 10 Diagnosis (Bar Chart) */}
          <Box flex={1.5} minWidth={0}>
            <Typography
              variant="subtitle2"
              fontWeight="800"
              color="#64748B"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 3,
              }}
            >
              10 Diagnosis Terbanyak
            </Typography>

            {chartData.length === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height={320}
                bgcolor="#F8FAFC"
                borderRadius="16px"
                border="1px dashed #E2E8F0"
              >
                <Typography color="text.secondary" variant="body2">
                  Belum ada data diagnosis tersedia
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 0, right: 30, left: 5, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      vertical={true}
                      stroke="#F1F5F9"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                      tickFormatter={(val) => truncateText(val, 22)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(79, 70, 229, 0.04)" }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      barSize={18}
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

          {/* RIGHT: Demografi Pasien */}
          <Box flex={1} minWidth={0}>
            <Typography
              variant="subtitle2"
              fontWeight="800"
              color="#64748B"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 3,
              }}
            >
              Demografi Gender
            </Typography>

            <Box
              sx={{
                p: 3,
                bgcolor: "#F8FAFC",
                borderRadius: "20px",
                border: "1px solid #F1F5F9",
                height: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Laki-laki Progress Group */}
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1.5}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "10px",
                        bgcolor: "#E0F2FE",
                        color: "#0EA5E9",
                      }}
                    >
                      <ManIcon fontSize="small" />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="700"
                      color="#334155"
                    >
                      Laki-laki
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="800" color="#0EA5E9">
                    {genderStats.L}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: "100%",
                    height: 8,
                    bgcolor: "#E2E8F0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${
                        genderStats.L + genderStats.P > 0
                          ? (genderStats.L / (genderStats.L + genderStats.P)) *
                            100
                          : 0
                      }%`,
                      height: "100%",
                      bgcolor: "#0EA5E9",
                      borderRadius: 4,
                      transition: "width 1s ease-in-out",
                    }}
                  />
                </Box>
              </Box>

              {/* Perempuan Progress Group */}
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1.5}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "10px",
                        bgcolor: "#FCE7F3",
                        color: "#EC4899",
                      }}
                    >
                      <WomanIcon fontSize="small" />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="700"
                      color="#334155"
                    >
                      Perempuan
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="800" color="#EC4899">
                    {genderStats.P}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: "100%",
                    height: 8,
                    bgcolor: "#E2E8F0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${
                        genderStats.L + genderStats.P > 0
                          ? (genderStats.P / (genderStats.L + genderStats.P)) *
                            100
                          : 0
                      }%`,
                      height: "100%",
                      bgcolor: "#EC4899",
                      borderRadius: 4,
                      transition: "width 1s ease-in-out",
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1, borderStyle: "dashed" }} />

              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="caption"
                  fontWeight="700"
                  color="#94A3B8"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  Total Kunjungan
                </Typography>
                <Typography variant="h4" fontWeight="900" color="#1E293B">
                  {(genderStats.L + genderStats.P).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pasien Terdaftar
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

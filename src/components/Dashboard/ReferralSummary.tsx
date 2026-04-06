"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Card,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import {
  patientService,
  PatientData,
  PoliType,
} from "@/services/patientService";

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

const REFERRAL_FIELDS = [
  {
    pb: "RUJUK_FASKES_PERTAMA_PB",
    pl: "RUJUK_FASKES_PERTAMA_PL",
    label: "Faskes Pertama",
  },
  { pb: "RUJUK_FKRTL_PB", pl: "RUJUK_FKRTL_PL", label: "FKRTL (RS)" },
  { pb: "PTM_RUJUK_FKRTL_PB", pl: "PTM_RUJUK_FKRTL_PL", label: "PTM ke FKRTL" },
  {
    pb: "DIRUJUK_BALIK_PUSKESMAS_PB",
    pl: "DIRUJUK_BALIK_PUSKESMAS_PL",
    label: "Balik Puskesmas",
  },
  {
    pb: "DIRUJUK_BALIK_FKRTL_PB",
    pl: "DIRUJUK_BALIK_FKRTL_PL",
    label: "Balik FKRTL",
  },
];

export interface ReferralField {
  pb: string;
  pl: string;
  label: string;
}

export interface ReferralStats {
  pb: number;
  pl: number;
  subtotal: number;
}

export interface ReferralMonthData {
  month: string;
  stats: ReferralStats[];
  total: number;
}

export interface ReferralGrandTotals {
  totals: { pb: number; pl: number }[];
  absoluteTotal: number;
}

export interface ReferralGroupData {
  year: string;
  fields: ReferralField[];
  tableData: ReferralMonthData[];
  grandTotals: ReferralGrandTotals;
}

export interface ReferralExportData {
  combined: ReferralGroupData;
  umum: ReferralGroupData;
  gigi: ReferralGroupData;
}

interface ReferralSummaryProps {
  onDataReady?: (data: ReferralExportData) => void;
}

export default function ReferralSummary({ onDataReady }: ReferralSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [viewMode, setViewMode] = useState<PoliType | "combined">("combined");
  const [data, setData] = useState<
    Record<string, { umum: PatientData[]; gigi: PatientData[] }>
  >({});

  const YEARS = Array.from({ length: 4 }, (_, i) => (2026 + i).toString());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results: Record<
        string,
        { umum: PatientData[]; gigi: PatientData[] }
      > = {};

      // Fetch for each month - SEQUENTIAL FETCH to avoid overwhelming GAS backend
      // Using a for-of loop instead of Promise.all(map) ensures we don't hit GAS rate limits (24 parallel requests)
      for (const month of MONTHS) {
        const sheetName = `${month} ${selectedYear}`;
        
        try {
          // We can still parallelize within a single month (umum + gigi = 2 requests)
          const [umum, gigi] = await Promise.all([
            patientService.getAllPatients(sheetName, "umum").catch(() => []),
            patientService.getAllPatients(sheetName, "gigi").catch(() => []),
          ]);
          
          results[month] = { umum, gigi };
        } catch (monthError) {
          console.error(`Error fetching data for ${month}:`, monthError);
          results[month] = { umum: [], gigi: [] };
        }
      }

      setData(results);
    } catch (error) {
      console.error("Error fetching referral summary:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isFilled = (val: unknown) => {
    if (!val) return false;
    const s = String(val).trim();
    return s !== "" && s !== "-" && s !== "0";
  };

  const getComputedData = useCallback(
    (mode: PoliType | "combined") => {
      const table = MONTHS.map((month) => {
        const monthData = data[month] || { umum: [], gigi: [] };
        const stats = REFERRAL_FIELDS.map((field) => {
          let pb = 0;
          let pl = 0;
          if (mode === "umum" || mode === "combined") {
            monthData.umum.forEach((p) => {
              if (isFilled(p[field.pb as keyof PatientData])) pb++;
              if (isFilled(p[field.pl as keyof PatientData])) pl++;
            });
          }
          if (mode === "gigi" || mode === "combined") {
            monthData.gigi.forEach((p) => {
              if (isFilled(p[field.pb as keyof PatientData])) pb++;
              if (isFilled(p[field.pl as keyof PatientData])) pl++;
            });
          }
          return { pb, pl, subtotal: pb + pl };
        });
        const total = stats.reduce((acc, curr) => acc + curr.subtotal, 0);
        return { month, stats, total };
      });

      const totals = REFERRAL_FIELDS.map((_, i) => ({
        pb: table.reduce((acc, curr) => acc + curr.stats[i].pb, 0),
        pl: table.reduce((acc, curr) => acc + curr.stats[i].pl, 0),
      }));
      const absoluteTotal = table.reduce((acc, curr) => acc + curr.total, 0);

      return {
        year: selectedYear,
        fields: REFERRAL_FIELDS,
        tableData: table,
        grandTotals: { totals, absoluteTotal },
      };
    },
    [data, selectedYear],
  );

  const currentViewData = useMemo(
    () => getComputedData(viewMode),
    [getComputedData, viewMode],
  );

  const tableData = currentViewData.tableData;
  const grandTotals = currentViewData.grandTotals;

  useEffect(() => {
    if (onDataReady && Object.keys(data).length > 0) {
      onDataReady({
        combined: getComputedData("combined"),
        umum: getComputedData("umum"),
        gigi: getComputedData("gigi"),
      });
    }
  }, [data, getComputedData, onDataReady]);

  return (
    <Box sx={{ mt: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            p: 3,
            background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "16px",
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.4)",
              }}
            >
              <SendIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1E293B">
                Rekap Rujukan
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Analisis data rujukan PB & PL — Tahun {selectedYear}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Tahun</InputLabel>
              <Select
                value={selectedYear}
                label="Tahun"
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ borderRadius: "10px", bgcolor: "white" }}
              >
                {YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              sx={{
                bgcolor: "white",
                borderRadius: "10px",
                p: 0.5,
                border: "1px solid #E2E8F0",
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: "8px !important",
                  px: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              }}
            >
              <ToggleButton value="combined">Gabungan</ToggleButton>
              <ToggleButton value="umum">Umum</ToggleButton>
              <ToggleButton value="gigi">Gigi</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#F8FAFC",
                    borderRight: "1px solid #E2E8F0",
                  }}
                >
                  NO
                </TableCell>
                <TableCell
                  rowSpan={2}
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#F8FAFC",
                    borderRight: "1px solid #E2E8F0",
                    minWidth: 120,
                  }}
                >
                  BULAN
                </TableCell>
                {REFERRAL_FIELDS.map((field) => (
                  <TableCell
                    key={field.label}
                    colSpan={2}
                    align="center"
                    sx={{
                      fontWeight: 800,
                      bgcolor: "#F8FAFC",
                      borderRight: "1px solid #E2E8F0",
                      color: "primary.main",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {field.label}
                  </TableCell>
                ))}
                <TableCell
                  rowSpan={2}
                  align="center"
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#F8FAFC",
                    color: "error.main",
                  }}
                >
                  TOTAL
                </TableCell>
              </TableRow>
              <TableRow>
                {REFERRAL_FIELDS.map((_, i) => (
                  <React.Fragment key={i}>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#F8FAFC",
                        fontSize: "0.7rem",
                        borderRight: "none",
                      }}
                    >
                      PB
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#F8FAFC",
                        fontSize: "0.7rem",
                        borderRight: "1px solid #E2E8F0",
                      }}
                    >
                      PL
                    </TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} thickness={5} />
                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: "text.secondary", fontWeight: 500 }}
                    >
                      Mengkalkulasi data rujukan...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {tableData.map((row, idx) => (
                    <TableRow key={row.month} hover>
                      <TableCell
                        sx={{
                          borderRight: "1px solid #F1F5F9",
                          color: "text.secondary",
                        }}
                      >
                        {idx + 1}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          borderRight: "1px solid #F1F5F9",
                        }}
                      >
                        {row.month}
                      </TableCell>
                      {row.stats.map((stat, i) => (
                        <React.Fragment key={i}>
                          <TableCell
                            align="center"
                            sx={{
                              color: stat.pb > 0 ? "primary.main" : "#CBD5E1",
                              fontWeight: stat.pb > 0 ? 700 : 400,
                            }}
                          >
                            {stat.pb}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderRight: "1px solid #F1F5F9",
                              color: stat.pl > 0 ? "secondary.main" : "#CBD5E1",
                              fontWeight: stat.pl > 0 ? 700 : 400,
                            }}
                          >
                            {stat.pl}
                          </TableCell>
                        </React.Fragment>
                      ))}
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 800,
                          bgcolor: "rgba(105, 108, 255, 0.04)",
                        }}
                      >
                        {row.total}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{
                        fontWeight: 900,
                        fontSize: "0.9rem",
                        color: "#1E293B",
                      }}
                    >
                      TOTAL TAHUN {selectedYear}
                    </TableCell>
                    {grandTotals.totals.map((t, i) => (
                      <React.Fragment key={i}>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 900,
                            color: "primary.main",
                            fontSize: "0.9rem",
                          }}
                        >
                          {t.pb}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 900,
                            color: "secondary.main",
                            fontSize: "0.9rem",
                            borderRight: "1px solid #E2E8F0",
                          }}
                        >
                          {t.pl}
                        </TableCell>
                      </React.Fragment>
                    ))}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        color: "error.main",
                        bgcolor: "rgba(255, 62, 29, 0.08)",
                      }}
                    >
                      {grandTotals.absoluteTotal}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 3,
          mt: 4,
        }}
      >
        <SummaryCard
          title="Rujuk Faskes Pertama"
          pb={grandTotals.totals[0].pb}
          pl={grandTotals.totals[0].pl}
          icon={<LocalHospitalIcon />}
          color="#696CFF"
        />
        <SummaryCard
          title="Rujuk FKRTL / RS"
          pb={grandTotals.totals[1].pb}
          pl={grandTotals.totals[1].pl}
          icon={<MedicalServicesIcon />}
          color="#03C3EC"
        />
        <SummaryCard
          title="Total Keseluruhan"
          pb={grandTotals.totals.reduce((a, b) => a + b.pb, 0)}
          pl={grandTotals.totals.reduce((a, b) => a + b.pl, 0)}
          icon={<AnalyticsIcon />}
          color="#FF3E1D"
          full
        />
      </Box>
    </Box>
  );
}

interface SummaryCardProps {
  title: string;
  pb: number;
  pl: number;
  icon: React.ReactNode;
  color: string;
  full?: boolean;
}

function SummaryCard({ title, pb, pl, icon, color, full }: SummaryCardProps) {
  return (
    <Card
      sx={{
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: "12px",
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="subtitle2"
            fontWeight={800}
            color="text.secondary"
          >
            {title}
          </Typography>
        </Stack>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <Box>
            <Typography variant="h4" fontWeight={900} color={color}>
              {pb + pl}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              PASIEN DIRUJUK
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" fontWeight={700} color="#64748B">
              PB: {pb} | PL: {pl}
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Typography
              variant="caption"
              sx={{ color: color, fontWeight: 800 }}
            >
              {full ? "TOTAL REKAP" : "TAHUNAN"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

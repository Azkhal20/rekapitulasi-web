"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  TablePagination,
} from "@mui/material";
import {
  DateRange as DateRangeIcon,
  PeopleAlt as PeopleIcon,
  MedicalServices as MedicalServicesIcon,
} from "@mui/icons-material";

import {
  patientService,
  PatientData,
  PoliType,
} from "@/services/patientService";

type PeriodOption = {
  label: string;
  startDate: Date;
  endDate: Date;
  monthsInvolved: string[];
};

// Fungsi untuk membuat daftar periode (2025-2028)
const generatePeriods = (): PeriodOption[] => {
  const periods: PeriodOption[] = [];
  const startYear = 2025;
  const endYear = 2028;

  const MONTH_NAMES = [
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

  const getMonthName = (date: Date) => MONTH_NAMES[date.getMonth()];

  for (let year = startYear; year <= endYear; year++) {
    for (let m = 0; m < 12; m++) {
      // Logika: Periode biasanya dari tanggal 16 bulan berjalan s/d 15 bulan berikutnya
      // Kecuali Desember yang dipecah dua.

      if (m === 11) {
        // PERIODE KHUSUS DESEMBER
        // Bagian 1: 16 Des - 31 Des
        const dStart1 = new Date(year, 11, 16);
        const dEnd1 = new Date(year, 11, 31);
        periods.push({
          label: `16 Desember ${year} - 31 Desember ${year}`,
          startDate: dStart1,
          endDate: dEnd1,
          monthsInvolved: [`DESEMBER ${year}`],
        });

        // Desember Part 2: 1-15 Jan tahun berikutnya
        if (year + 1 <= endYear) {
          const dStart2 = new Date(year + 1, 0, 1);
          const dEnd2 = new Date(year + 1, 0, 15);
          periods.push({
            label: `1 Januari ${year + 1} - 15 Januari ${year + 1}`,
            startDate: dStart2,
            endDate: dEnd2,
            monthsInvolved: [`JANUARI ${year + 1}`],
          });
        }
      } else {
        const dStart = new Date(year, m, 16);
        const dEnd = new Date(year, m + 1, 15);

        const m1Name = `${getMonthName(dStart)} ${year}`;
        const m2Name = `${getMonthName(dEnd)} ${dEnd.getFullYear()}`;

        const rawStart = dStart.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const rawEnd = dEnd.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        periods.push({
          label: `${rawStart} - ${rawEnd}`,
          startDate: dStart,
          endDate: dEnd,
          monthsInvolved: Array.from(new Set([m1Name, m2Name])),
        });
      }
    }
  }

  // Filter sesuai permintaan: Mulai dari 16 November 2025
  return periods.filter((p) => p.startDate >= new Date(2025, 10, 16));
};

// Parsing berbagai format tanggal (ISO, DD-MM-YYYY, DD Bulan YYYY)
const parseRowDate = (dateStr: string): Date => {
  if (!dateStr || dateStr === "-") return new Date("Invalid");

  const cleanStr = dateStr.trim();

  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) return d;

  const parts = cleanStr.split(/[\s-/]+/);

  if (parts.length >= 3) {
    let day: number, monthIndex: number | undefined, year: number;

    // Kasus: YYYY-MM-DD
    if (parts[0].length === 4 && !isNaN(parseInt(parts[0]))) {
      year = parseInt(parts[0]);
      monthIndex = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else {
      // Kasus: DD-MM-YYYY atau DD Bulan YYYY
      day = parseInt(parts[0]);
      const monthRaw = parts[1].toLowerCase();
      year = parseInt(parts[2]);

      // Cek apakah bulan berupa angka atau teks
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

// Helper untuk akses properti dinamis
const getPatientValue = (row: PatientData, key: string): string => {
  const record = row as unknown as Record<string, unknown>;
  return (record[key] as string) || "";
};

export default function ReportsPage() {
  const [selectedPoli, setSelectedPoli] = useState<PoliType>("umum");
  const [periods] = useState<PeriodOption[]>(generatePeriods());
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<string>("");

  const [reportData, setReportData] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Flag untuk mencegah hydration mismatch
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Load selected poli dan period dari localStorage atau set default saat mount
  useEffect(() => {
    if (typeof window === "undefined") return; // Skip during SSR

    // 1. Load Poli
    const savedPoli = localStorage.getItem("reports_selected_poli");
    if (savedPoli && (savedPoli === "umum" || savedPoli === "gigi")) {
      setSelectedPoli(savedPoli as PoliType);
    }

    // 2. Load Periode
    const savedPeriod = localStorage.getItem("reports_selected_period");
    if (savedPeriod && periods.find((p) => p.label === savedPeriod)) {
      setSelectedPeriodLabel(savedPeriod);
    } else {
      const today = new Date();
      const currentPeriod = periods.find(
        (p) => today >= p.startDate && today <= p.endDate,
      );
      if (currentPeriod) {
        setSelectedPeriodLabel(currentPeriod.label);
      } else if (periods.length > 0) {
        setSelectedPeriodLabel(periods[0].label);
      }
    }
    setIsLoaded(true);
  }, [periods]);

  // Save selectedPoli ke localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("reports_selected_poli", selectedPoli);
    }
  }, [selectedPoli, isLoaded]);

  // Save selected period ke localStorage
  useEffect(() => {
    if (isLoaded && selectedPeriodLabel && typeof window !== "undefined") {
      localStorage.setItem("reports_selected_period", selectedPeriodLabel);
    }
  }, [selectedPeriodLabel, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !selectedPeriodLabel) return;

    const period = periods.find((p) => p.label === selectedPeriodLabel);
    if (!period) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setReportData([]);
      setPage(0);

      console.log("Mengambil Laporan Untuk:", period.monthsInvolved);

      try {
        const promises = period.monthsInvolved.map((sheetName) =>
          patientService
            .getAllPatients(sheetName, selectedPoli)
            .catch((err) => {
              console.warn(
                `Sheet ${sheetName} tidak ditemukan atau error:`,
                err,
              );
              return [] as PatientData[]; // Return kosong jika gagal
            }),
        );

        const results = await Promise.all(promises);

        // Gabungkan Data
        const allPatients = results.flat();

        // Filter Sesuai Rentang Tanggal
        const filtered = allPatients.filter((p) => {
          if (!p.TANGGAL) return false;

          // Parsing tanggal dengan teliti
          const pDate = parseRowDate(String(p.TANGGAL));

          if (isNaN(pDate.getTime())) {
            if (p.TANGGAL !== "-" && p.TANGGAL !== "") {
              console.warn("Melewati baris tanggal tidak valid:", p.TANGGAL);
            }
            return false;
          }

          const check = new Date(
            pDate.getFullYear(),
            pDate.getMonth(),
            pDate.getDate(),
          );
          const start = new Date(
            period.startDate.getFullYear(),
            period.startDate.getMonth(),
            period.startDate.getDate(),
          );
          const end = new Date(
            period.endDate.getFullYear(),
            period.endDate.getMonth(),
            period.endDate.getDate(),
          );

          return check >= start && check <= end;
        });

        filtered.sort(
          (a, b) =>
            new Date(a.TANGGAL).getTime() - new Date(b.TANGGAL).getTime(),
        );

        setReportData(filtered);
      } catch (err) {
        console.error("Error generating report:", err);
        setError(
          "Gagal mengambil data laporan. Pastikan koneksi internet lancar.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriodLabel, selectedPoli, periods, isLoaded]);

  const [filterDate, setFilterDate] = useState<string>("All");

  useEffect(() => {
    setFilterDate("All");
  }, [reportData]);

  const availableDates = useMemo(() => {
    const dates = reportData.map((p) => p.TANGGAL).filter(Boolean);
    const unique = Array.from(new Set(dates));

    return unique.sort((a, b) => {
      const da = parseRowDate(a);
      const db = parseRowDate(b);
      return da.getTime() - db.getTime();
    });
  }, [reportData]);

  const filteredReportData = useMemo(() => {
    if (filterDate === "All") return reportData;
    return reportData.filter((p) => p.TANGGAL === filterDate);
  }, [reportData, filterDate]);

  const activePeriod = periods.find((p) => p.label === selectedPeriodLabel);

  const paginatedData = filteredReportData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h4"
          fontWeight="800"
          sx={{ mb: 1, color: "#1E293B", letterSpacing: "-0.02em" }}
        >
          Laporan Periodik
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Data pasien dengan periode cut-off.
        </Typography>
      </Box>

      {/* CONTROLS CARD */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          mb: 4,
          bgcolor: "white",
        }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={3}
          alignItems="center"
        >
          <Box flex={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Pilih Poli</InputLabel>
              <Select
                value={selectedPoli}
                label="Pilih Poli"
                onChange={(e) => setSelectedPoli(e.target.value as PoliType)}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value="umum">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" sx={{ color: "#4F46E5" }} />{" "}
                    Poli Umum
                  </Box>
                </MenuItem>
                <MenuItem value="gigi">
                  <Box display="flex" alignItems="center" gap={1}>
                    <MedicalServicesIcon
                      fontSize="small"
                      sx={{ color: "#DB2777" }}
                    />{" "}
                    Poli Gigi
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box flex={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Pilih Periode Laporan</InputLabel>
              <Select
                value={selectedPeriodLabel}
                label="Pilih Periode Laporan"
                onChange={(e) => setSelectedPeriodLabel(e.target.value)}
                sx={{ borderRadius: "12px" }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                {periods.map((p) => (
                  <MenuItem key={p.label} value={p.label}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box flex={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Tanggal</InputLabel>
              <Select
                value={filterDate}
                label="Filter Tanggal"
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(0); // Reset page on filter change
                }}
                sx={{ borderRadius: "12px" }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                <MenuItem value="All">
                  <Box display="flex" alignItems="center" gap={1}>
                    <p>Semua Tanggal</p>
                  </Box>
                </MenuItem>
                {availableDates.map((dateStr) => (
                  <MenuItem key={dateStr} value={dateStr}>
                    {dateStr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* SUMMARY STATS */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={3}
        mb={4}
      >
        <Box flex={1}>
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #F1F5F9",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="text.secondary"
                sx={{ textTransform: "uppercase" }}
              >
                Total Pasien
              </Typography>
              <Typography
                variant="h3"
                fontWeight="800"
                textAlign="center"
                sx={{
                  color: selectedPoli === "gigi" ? "#DB2777" : "#4F46E5",
                  mt: 1,
                }}
              >
                {loading ? "..." : filteredReportData.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Card Total L */}
        <Box flex={1}>
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #E0F2FE",
              bgcolor: "#F0F9FF",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="#0369A1"
                sx={{ textTransform: "uppercase" }}
              >
                Laki-laki (L)
              </Typography>
              <Typography
                variant="h3"
                fontWeight="800"
                textAlign="center"
                sx={{
                  color: "#0284C7",
                  mt: 1,
                }}
              >
                {loading
                  ? "..."
                  : filteredReportData.filter(
                      (p) =>
                        p.L &&
                        String(p.L).trim() !== "" &&
                        String(p.L).trim() !== "-",
                    ).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Card Total P */}
        <Box flex={1}>
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FCE7F3",
              bgcolor: "#FDF2F8",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="#BE185D"
                sx={{ textTransform: "uppercase" }}
              >
                Perempuan (P)
              </Typography>
              <Typography
                variant="h3"
                fontWeight="800"
                textAlign="center"
                sx={{
                  color: "#DB2777",
                  mt: 1,
                }}
              >
                {loading
                  ? "..."
                  : filteredReportData.filter(
                      (p) =>
                        p.P &&
                        String(p.P).trim() !== "" &&
                        String(p.P).trim() !== "-",
                    ).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {activePeriod && (
          <Box flex={2}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "16px",
                boxShadow: "none",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CardContent sx={{ width: "100%" }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <DateRangeIcon sx={{ color: "#64748B", fontSize: 32 }} />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      Periode Aktif
                    </Typography>
                    <Typography variant="h6" fontWeight="700" color="#334155">
                      {activePeriod.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mengambil data dari Sheet:{" "}
                      <span style={{ fontWeight: 600 }}>
                        {activePeriod.monthsInvolved.join(" & ")}
                      </span>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* DATA TABLE */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "12px" }}>
          {error}
        </Alert>
      ) : (
        <Paper
          sx={{
            width: "100%",
            overflow: "hidden",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
          }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  {[
                    "NO",
                    "TANGGAL",
                    "NAMA",
                    "L/P",
                    "USIA",
                    "NIP",
                    "OBS TTV",
                    "DIAGNOSIS",
                    "ICD-10",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        color: "#475569",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "#94A3B8",
                      }}
                    >
                      Tidak ada data pasien pada periode ini.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: "2px solid #E2E8F0" }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#334155",
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {page * rowsPerPage + index + 1}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {row.TANGGAL}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1E293B",
                          fontWeight: 600,
                        }}
                      >
                        {row.NAMA}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {row.L ? "L" : row.P ? "P" : "-"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {row.USIA}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {getPatientValue(row, "NIP") || row.NIP || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {getPatientValue(row, "OBS TTV") || row.OBS_TTV || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {row.DIAGNOSIS ? (
                          <Chip
                            label={row.DIAGNOSIS}
                            size="small"
                            sx={{ bgcolor: "#F1F5F9", fontWeight: 500 }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>
                        {getPatientValue(row, "ICD-10") || row.ICD10 ? (
                          <Chip
                            label={getPatientValue(row, "ICD-10") || row.ICD10}
                            size="small"
                            sx={{
                              bgcolor: "#F0F9FF",
                              color: "#0284C7",
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredReportData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              "& .MuiTablePagination-spacer": {
                display: "none",
              },
              "& .MuiToolbar-root": {
                justifyContent: "space-between",
              },
              "& .MuiTablePagination-selectLabel": {
                ml: 0,
              },
              "& .MuiTablePagination-input": {
                mr: "auto",
                ml: 2,
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}

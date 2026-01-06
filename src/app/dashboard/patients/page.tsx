"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  SelectChangeEvent,
} from "@mui/material";
import PatientDataTable from "@/components/PatientDataTable";
import { patientService } from "@/services/patientService"; // Use Service instead of lib
import { PatientData } from "@/services/patientService";

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

const YEARS = ["2025", "2026", "2027", "2028"];

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to current month/year dynamically
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date()
      .toLocaleDateString("id-ID", { month: "long" })
      .toUpperCase();
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  // No longer loading from localStorage on mount to ensure real-time month sync
  // Users can still change it during session, but it will reset to current on next load

  const handleMonthChange = (e: SelectChangeEvent<string>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    localStorage.setItem("selectedMonthPatients", newMonth);
  };

  const handleYearChange = (e: SelectChangeEvent<string>) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
    localStorage.setItem("selectedYearPatients", newYear);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch using the monthly-aware service (Default to 'umum' for legacy page)
      const sheetName = `${selectedMonth} ${selectedYear}`;
      const data = await patientService.getAllPatients(sheetName, "umum");
      setPatients(data);
    } catch (err) {
      console.error("Error loading patient data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data pasien. Pastikan Google Sheets dapat diakses dan Apps Script sudah dideploy ulang."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Reload when month changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDataChange = () => {
    loadData();
  };

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            fontWeight="bold"
            sx={{ color: "#111827" }}
          >
            Data Pasien - {selectedMonth} {selectedYear}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total: {patients.length} pasien terdaftar pada bulan ini
          </Typography>
        </Box>

        {/* Filter Selectors */}
        <Box display="flex" gap={2}>
          <Paper sx={{ p: 1, borderRadius: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Tahun</InputLabel>
              <Select
                value={selectedYear}
                label="Tahun"
                onChange={handleYearChange}
              >
                {YEARS.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 1, borderRadius: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Pilih Bulan</InputLabel>
              <Select
                value={selectedMonth}
                label="Pilih Bulan"
                onChange={handleMonthChange}
              >
                {MONTHS.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Box>
      </Box>

      {loading ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress
            size={40}
            thickness={4}
            sx={{ color: "#4F46E5", mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Memuat data bulan {selectedMonth}...
          </Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            borderRadius: "12px",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Gagal Memuat Data ({selectedMonth})
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
          <Typography variant="caption">
            Tips: Pastikan Tab Sheet bernama <strong>{selectedMonth}</strong>{" "}
            sudah dibuat di Google Sheet Anda dan memiliki Header kolom yang
            sama.
          </Typography>
        </Alert>
      ) : (
        <PatientDataTable
          data={patients}
          onDataChange={handleDataChange}
          sheetName={`${selectedMonth} ${selectedYear}`}
          poliType="umum"
        />
      )}
    </Box>
  );
}

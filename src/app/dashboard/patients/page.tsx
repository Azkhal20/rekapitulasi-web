"use client";

import { useState } from "react";
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
import { usePatients } from "@/hooks/usePatients";

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
  // Default to current month/year dynamically
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date()
      .toLocaleDateString("id-ID", { month: "long" })
      .toUpperCase();
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  const sheetName = `${selectedMonth} ${selectedYear}`;
  const {
    data: patients = [],
    isLoading,
    error,
  } = usePatients(sheetName, "umum");

  const handleMonthChange = (e: SelectChangeEvent<string>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
  };

  const handleYearChange = (e: SelectChangeEvent<string>) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
  };

  // onDataChange is no longer needed strictly for reloading,
  // but if passed to table it might be used to close dialogs etc,
  // though React Query handles the data refresh.
  const handleDataChange = () => {
    // No-op or refetch if needed manually, but invalidation handles it.
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

      {isLoading ? (
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
            {(error as Error).message}
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
          sheetName={sheetName}
          poliType="umum"
        />
      )}
    </Box>
  );
}

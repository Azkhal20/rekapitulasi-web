"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
} from "@mui/material";
import PatientDataTable from "@/components/PatientDataTable";
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

const YEARS = ["2025", "2026", "2027", "2028"];

export default function PoliPage() {
  const params = useParams();
  const rawType = (params.type as string)?.toLowerCase();

  // Validate and determine Poli Type
  const isValidPoli = rawType === "umum" || rawType === "gigi";
  const poliType: PoliType = rawType === "gigi" ? "gigi" : "umum";

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for selected month and year, defaults to current date
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleDateString("id-ID", { month: "long" }).toUpperCase()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  // Mark as loaded immediately since we don't wait for localStorage anymore
  useEffect(() => {
    // 1. Load Last Selected Month if valid
    const lastMonth = localStorage.getItem(`poli_${poliType}_month`);
    if (lastMonth && MONTHS.includes(lastMonth)) {
      setSelectedMonth(lastMonth);
    }

    // 2. Load Last Selected Year if valid
    const lastYear = localStorage.getItem(`poli_${poliType}_year`);
    if (lastYear && YEARS.includes(lastYear)) {
      setSelectedYear(lastYear);
    }

    setIsStorageLoaded(true);
  }, [poliType]);

  // Save ke localStorage setiap kali month atau year berubah
  useEffect(() => {
    if (isStorageLoaded && selectedMonth) {
      localStorage.setItem(`poli_${poliType}_month`, selectedMonth);
    }
  }, [selectedMonth, poliType, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded && selectedYear) {
      localStorage.setItem(`poli_${poliType}_year`, selectedYear);
    }
  }, [selectedYear, poliType, isStorageLoaded]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch using the monthly-aware service AND poliType
      const sheetName = `${selectedMonth} ${selectedYear}`;
      const data = await patientService.getAllPatients(sheetName, poliType);
      setPatients(data);
    } catch (err) {
      console.error("Error loading patient data:", err);
      // More friendly error message
      setError(err instanceof Error ? err.message : `Gagal memuat data.`);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, poliType]);

  // Reload when month or poli changes (hanya setelah storage di-load)
  useEffect(() => {
    if (isValidPoli && isStorageLoaded) {
      loadData();
    }
  }, [loadData, isValidPoli, isStorageLoaded]);

  const handleDataChange = () => {
    loadData();
  };

  if (!isValidPoli) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Alert severity="error">
          Tipe Poli tidak valid. Gunakan <strong>/dashboard/poli/umum</strong>{" "}
          atau <strong>/dashboard/poli/gigi</strong>.
        </Alert>
      </Box>
    );
  }

  const poliDisplayName = poliType === "gigi" ? "Poli Gigi" : "Poli Umum";
  const poliColor = poliType === "gigi" ? "#EC4899" : "#4F46E5"; // Pink for Gigi, Blue for Umum

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
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: "#111827" }}
            >
              Data Pasien
            </Typography>
            <Box
              sx={{
                bgcolor: poliColor,
                color: "white",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.8em",
              }}
            >
              {poliDisplayName}
            </Box>
          </Box>

          <Typography variant="body1" color="text.secondary">
            Bulan{" "}
            <strong>
              {selectedMonth} {selectedYear}
            </strong>{" "}
            • Total: {patients.length} pasien
          </Typography>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={2}>
          <Paper sx={{ p: 1, borderRadius: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Tahun</InputLabel>
              <Select
                value={selectedYear}
                label="Tahun"
                onChange={(e) => setSelectedYear(e.target.value)}
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
                onChange={(e) => setSelectedMonth(e.target.value)}
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
            sx={{ color: poliColor, mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Memuat data {poliDisplayName} ({selectedMonth})...
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
            Tips: Pastikan URL Apps Script untuk{" "}
            <strong>{poliDisplayName}</strong> sudah disetup di .env.local dan
            Tab Sheet bernama <strong>{selectedMonth}</strong> sudah ada.
          </Typography>
        </Alert>
      ) : (
        <PatientDataTable
          data={patients}
          onDataChange={handleDataChange}
          sheetName={`${selectedMonth} ${selectedYear}`} // Pass chosen month + year
          poliType={poliType} // Pass chosen poli
        />
      )}
    </Box>
  );
}

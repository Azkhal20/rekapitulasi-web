"use client";

import { useEffect, useState } from "react";
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
import { patientService } from "@/services/patientService"; // Use Service instead of lib
import { PatientData } from "@/services/patientService";

// Custom Order as requested: Starting from NOVEMBER
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

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("NOVEMBER"); // Default start

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch using the monthly-aware service
      const data = await patientService.getAllPatients(selectedMonth);
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
  };

  // Reload when month changes
  useEffect(() => {
    loadData();
  }, [selectedMonth]);

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
            Data Pasien - Bulan {selectedMonth}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total: {patients.length} pasien terdaftar pada bulan ini
          </Typography>
        </Box>

        {/* Month Selector */}
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
          data={patients} // Cast to Patient[] if needed, but interfaces match roughly
          onDataChange={handleDataChange}
          sheetName={selectedMonth} // Pass selected month to table
        />
      )}
    </Box>
  );
}

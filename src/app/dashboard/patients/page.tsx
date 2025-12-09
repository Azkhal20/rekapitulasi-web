"use client";

import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import PatientDataTable from "@/components/PatientDataTable";
import { fetchPatientData } from "@/lib/googleSheets";
import { Patient } from "@/types/patient";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPatientData();
        setPatients(data);
      } catch (err) {
        console.error("Error loading patient data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data pasien. Pastikan Google Sheets dapat diakses dan API key valid."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress
          size={40}
          thickness={4}
          sx={{ color: "#4F46E5", mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Memuat data pasien...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography
          variant="h5"
          gutterBottom
          fontWeight="bold"
          sx={{ color: "#111827" }}
        >
          Data Pasien
        </Typography>
        <Alert
          severity="error"
          sx={{
            mt: 2,
            borderRadius: "12px",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Gagal Memuat Data
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, opacity: 0.8 }}
          >
            Tips: Pastikan Google Sheet Anda diatur ke &quot;Anyone with the
            link&quot; (Public) jika hanya menggunakan API Key.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography
          variant="h5"
          gutterBottom
          fontWeight="bold"
          sx={{ color: "#111827" }}
        >
          Data Pasien
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {patients.length} pasien terdaftar
        </Typography>
      </Box>

      <PatientDataTable data={patients} />
    </Box>
  );
}

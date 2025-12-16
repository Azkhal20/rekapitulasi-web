"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PatientData } from "@/services/patientService";

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PatientData, "id">) => Promise<void>;
  initialData?: PatientData | null;
  mode: "add" | "edit";
  defaultTahun?: string; // New Prop to override default year logic
}

// Helper: Convert "YYYY-MM-DD" to "DD MMM YYYY" (Indonesian)
// Example: "2025-12-15" -> "15 Des 2025"
const formatDateForSheet = (isoDate: string): string => {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  try {
    const [year, month, day] = isoDate.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return isoDate;
  }
};

// Helper: Convert "DD MMM YYYY" (Indonesian) to "YYYY-MM-DD"
// Example: "15 Des 2025" -> "2025-12-15"
const parseDateFromSheet = (displayDate: string): string => {
  if (!displayDate) return "";
  // Check if already ISO
  if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) return displayDate;

  // Manual map for Indonesian short months
  const MONTH_MAP: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    Mei: "05",
    Jun: "06",
    Jul: "07",
    Agu: "08",
    Sep: "09",
    Okt: "10",
    Nov: "11",
    Des: "12",
  };

  try {
    // Expected format: "15 Des 2025"
    const parts = displayDate.split(" ");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const monthStr = parts[1];
      const year = parts[2];
      const month = MONTH_MAP[monthStr];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    // Fallback if parsing fails (maybe english month?)
    const date = new Date(displayDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch (_) {
    console.warn("Failed to parse date:", displayDate);
  }
  return ""; // Return empty if parsing completely fails to avoid invalid date inputs
};

export default function PatientFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  defaultTahun,
}: PatientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<PatientData, "id">>({
    TANGGAL: "",
    TAHUN: "",
    BULAN: "",
    HARI: "",
    ENAM_BELAS_LIMA_BELAS: "",
    L: "",
    P: "",
    NAMA: "",
    USIA: "",
    NIP: "",
    OBS_TTV: "",
    KELUHAN: "",
    DIAGNOSIS: "",
    ICD10: "",
    TINDAKAN: "",
    OBAT: "",
  });

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData && mode === "edit") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...rest } = initialData;

        // Convert Date for Input Field
        // Data from sheet: "15 Des 2025" -> Input needs "2025-12-15"
        const convertedData = { ...rest };
        if (convertedData.TANGGAL) {
          convertedData.TANGGAL = parseDateFromSheet(convertedData.TANGGAL);
        }

        setFormData(convertedData);
      } else {
        // Auto-fill date fields for new patient
        const now = new Date();
        const tanggal = now.toISOString().split("T")[0]; // YYYY-MM-DD

        // AUTO NUMBERING LOGIC: Use defaultTahun prop if available, else fallback to current year
        const tahun = defaultTahun || now.getFullYear().toString();

        const bulan = ""; // Cleared
        const hari = ""; // Cleared

        setFormData({
          TANGGAL: tanggal,
          TAHUN: tahun,
          BULAN: bulan,
          HARI: hari,
          ENAM_BELAS_LIMA_BELAS: "",
          L: "",
          P: "",
          NAMA: "",
          USIA: "",
          NIP: "",
          OBS_TTV: "",
          KELUHAN: "",
          DIAGNOSIS: "",
          ICD10: "",
          TINDAKAN: "",
          OBAT: "",
        });
      }
      setError(null);
    }
  }, [open, initialData, mode, defaultTahun]);

  const handleChange = (
    field: keyof Omit<PatientData, "id">,
    value: string
  ) => {
    setFormData((prev) => {
      const updates = { ...prev, [field]: value };

      // Auto-update related date fields if TANGGAL changes
      if (field === "TANGGAL" && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Disabled auto-fill for HARI and BULAN on date change based on request?
            // User requested default values be cleared.
            // If user selects a date, should we fill them?
            // "data hari dan bulan nya diapus defaultnya, karena isinya adalah angka bukan nama hari atau bulannya"
            // This implies they want to enter it manually OR the auto-calc was wrong.
            // Let's keep auto-calc OFF for now as per "diapus defaultnya".
            // If they want auto-calc, they usually say "fix the auto calc".
            // updates.BULAN = date.toLocaleDateString("id-ID", { month: "long" });
            // updates.HARI = date.toLocaleDateString("id-ID", { weekday: "long" });
          }
        } catch (_) {
          // ignore invalid date during typing
        }
      }

      return updates;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PREPARE DATA FOR SHEET
      // Convert "2025-12-15" -> "15 Des 2025"
      const dataToSubmit = { ...formData };
      if (dataToSubmit.TANGGAL) {
        dataToSubmit.TANGGAL = formatDateForSheet(dataToSubmit.TANGGAL);
      }

      await onSubmit(dataToSubmit);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 5 },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "2px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          fontWeight: 700,
        }}
      >
        {mode === "add" ? "Tambah Data Pasien" : "Edit Data Pasien"}
        {!loading && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Waktu & Tanggal Section */}
            <Box sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}>
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                INFORMASI WAKTU
              </Typography>
            </Box>

            <TextField
              label="Tanggal"
              type="date"
              value={formData.TANGGAL}
              onChange={(e) => handleChange("TANGGAL", e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{
                gridColumn: { xs: "1fr", sm: "span 2" },
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
              }}
            >
              <TextField
                label="Hari"
                value={formData.HARI}
                onChange={(e) => handleChange("HARI", e.target.value)}
              />
              <TextField
                label="Bulan"
                value={formData.BULAN}
                onChange={(e) => handleChange("BULAN", e.target.value)}
              />
              <TextField
                label="Tahun"
                placeholder="No. Urut"
                value={formData.TAHUN}
                onChange={(e) => handleChange("TAHUN", e.target.value)}
                helperText="Auto +1 dari data terakhir"
              />
            </Stack>

            {/* Identitas Pasien Section */}
            <Box sx={{ gridColumn: { xs: "1fr", sm: "span 2" }, mt: 1 }}>
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                IDENTITAS PASIEN
              </Typography>
            </Box>

            <TextField
              label="Nama Pasien"
              value={formData.NAMA}
              onChange={(e) => handleChange("NAMA", e.target.value)}
              fullWidth
              required
              placeholder="Masukkan nama lengkap"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Laki-laki (L)"
                value={formData.L}
                onChange={(e) => handleChange("L", e.target.value)}
                fullWidth
                placeholder="1/0"
              />
              <TextField
                label="Perempuan (P)"
                value={formData.P}
                onChange={(e) => handleChange("P", e.target.value)}
                fullWidth
                placeholder="1/0"
              />
            </Stack>

            <TextField
              label="Usia"
              value={formData.USIA}
              onChange={(e) => handleChange("USIA", e.target.value)}
              fullWidth
            />

            <TextField
              label="NIP / Identitas Lain"
              value={formData.NIP}
              onChange={(e) => handleChange("NIP", e.target.value)}
              fullWidth
            />

            {/* Medis Section */}
            <Box sx={{ gridColumn: { xs: "1fr", sm: "span 2" }, mt: 1 }}>
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                DATA MEDIS
              </Typography>
            </Box>

            <TextField
              label="Keluhan"
              value={formData.KELUHAN}
              onChange={(e) => handleChange("KELUHAN", e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Diagnosis"
              value={formData.DIAGNOSIS}
              onChange={(e) => handleChange("DIAGNOSIS", e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="ICD-10"
              value={formData.ICD10}
              onChange={(e) => handleChange("ICD10", e.target.value)}
              fullWidth
            />

            <TextField
              label="Tindakan"
              value={formData.TINDAKAN}
              onChange={(e) => handleChange("TINDAKAN", e.target.value)}
              fullWidth
            />

            <TextField
              label="Obat / Terapi"
              value={formData.OBAT}
              onChange={(e) => handleChange("OBAT", e.target.value)}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}
            />

            <TextField
              label="OBS TTV"
              value={formData.OBS_TTV}
              onChange={(e) => handleChange("OBS_TTV", e.target.value)}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 3, pt: 2, borderTop: "1px solid #eee" }}
        >
          <Button onClick={onClose} disabled={loading} color="inherit">
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#696CFF",
              "&:hover": { backgroundColor: "#5f61e6" },
              minWidth: 100,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

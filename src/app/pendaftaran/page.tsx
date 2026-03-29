"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Fade,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PeopleIcon from "@mui/icons-material/People";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { patientService, PoliType, PatientData } from "@/services/patientService";
import { getCurrentSheetName, isWithinOperationalHours, formatDateForSheet } from "@/utils/dateUtils";
import { useAutoCalculate } from "@/hooks/useAutoCalculate";

export default function PendaftaranPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Poli, 2: Form, 3: Success
  const [poliType, setPoliType] = useState<PoliType>("umum");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    NAMA: "",
    JENIS_KELAMIN: "L", // L/P
    USIA: "",
    JENIS_PASIEN: "BARU", // BARU/LAMA
    NIP: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const { autoValues, isCalculating } = useAutoCalculate(today, poliType, step === 2);

  useEffect(() => {
    // Check operational hours initially
    if (!isWithinOperationalHours()) {
      setIsClosed(true);
    }
  }, []);

  const handlePoliSelect = (type: PoliType) => {
    setPoliType(type);
    setStep(2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithinOperationalHours()) {
      setIsClosed(true);
      return;
    }

    if (!formData.NAMA || !formData.USIA || !formData.NIP) {
      setError("Mohon lengkapi semua data wajib.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare final patient data with all required columns
      const finalData: Omit<PatientData, "id"> = {
        TANGGAL: formatDateForSheet(today),
        TAHUN: autoValues.TAHUN,
        BULAN: autoValues.BULAN,
        HARI: autoValues.HARI,
        ENAM_BELAS_LIMA_BELAS: autoValues.ENAM_BELAS_LIMA_BELAS,
        L: formData.JENIS_KELAMIN === "L" ? "1" : "",
        P: formData.JENIS_KELAMIN === "P" ? "1" : "",
        BARU: formData.JENIS_PASIEN === "BARU" ? "1" : "",
        LAMA: formData.JENIS_PASIEN === "LAMA" ? "1" : "",
        NAMA: formData.NAMA.toUpperCase(),
        USIA: formData.USIA,
        NIP: formData.NIP,
        OBS_TTV: "",
        KELUHAN: "",
        DIAGNOSIS: "",
        ICD10: "",
        TINDAKAN: "",
        OBAT: "",
      };

      const sheetName = getCurrentSheetName();
      await patientService.addPatient(finalData, sheetName, poliType);
      
      setStep(3);
    } catch (err) {
      console.error("Pendaftaran error:", err);
      setError("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (isClosed) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 4, bgcolor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)" }}>
          <LocalHospitalIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" fontWeight="800" gutterBottom>Pendaftaran Tutup</Typography>
          <Typography color="text.secondary">Pendaftaran hanya aktif pada pukul 08.00 - 16.00 WIB.</Typography>
          <Typography sx={{ mt: 2 }} variant="body2">Silakan kembali di jam operasional. Terimakasih.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#F3F4F6", 
      py: { xs: 4, md: 8 },
      background: "radial-gradient(circle at top right, #EEF2FF 0%, #F3F4F6 100%)"
    }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ display: "inline-flex", p: 1.5, borderRadius: 2, bgcolor: "white", boxShadow: 1, mb: 2 }}>
            <LocalHospitalIcon sx={{ color: "#696CFF", fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: "#1E293B", letterSpacing: "-0.02em" }}>
            Pendaftaran Mandiri
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Silakan isi data untuk mendapatkan nomor antrian
          </Typography>
        </Box>

        {/* Step 1: Poli Selection */}
        {step === 1 && (
          <Fade in={step === 1}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
                <CardActionArea onClick={() => handlePoliSelect("umum")}>
                  <CardContent sx={{ p: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#EEF2FF", borderRadius: 3, color: "#4F46E5" }}>
                      <PeopleIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="800">Poli Umum</Typography>
                      <Typography variant="body2" color="text.secondary">Pemeriksaan kesehatan umum dan kontrol rujukan</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>

              <Card sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
                <CardActionArea onClick={() => handlePoliSelect("gigi")}>
                  <CardContent sx={{ p: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#FDF2F8", borderRadius: 3, color: "#DB2777" }}>
                      <MedicalServicesIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="800">Poli Gigi</Typography>
                      <Typography variant="body2" color="text.secondary">Pemeriksaan gigi, cabut gigi, dan perawatan lainnya</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Stack>
          </Fade>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <Fade in={step === 2}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid #E2E8F0" }}>
              <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton onClick={() => setStep(1)} size="small" sx={{ color: "#64748B" }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="800">Data Diri Pasien — Poli {poliType === "umum" ? "Umum" : "Gigi"}</Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap sesuai KTP"
                    required
                    value={formData.NAMA}
                    onChange={(e) => handleInputChange("NAMA", e.target.value)}
                    InputProps={{ sx: { borderRadius: 2.5 } }}
                  />

                  <FormControl component="fieldset">
                    <FormLabel sx={{ fontWeight: 700, mb: 1, fontSize: "0.875rem" }}>Jenis Kelamin</FormLabel>
                    <RadioGroup
                      row
                      value={formData.JENIS_KELAMIN}
                      onChange={(e) => handleInputChange("JENIS_KELAMIN", e.target.value)}
                    >
                      <FormControlLabel value="L" control={<Radio color="primary" />} label="Laki-laki" />
                      <FormControlLabel value="P" control={<Radio color="primary" />} label="Perempuan" />
                    </RadioGroup>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Usia"
                    placeholder="Contoh: 25"
                    type="number"
                    required
                    value={formData.USIA}
                    onChange={(e) => handleInputChange("USIA", e.target.value)}
                    InputProps={{ sx: { borderRadius: 2.5 } }}
                  />

                  <FormControl component="fieldset">
                    <FormLabel sx={{ fontWeight: 700, mb: 1, fontSize: "0.875rem" }}>Jenis Pasien</FormLabel>
                    <RadioGroup
                      row
                      value={formData.JENIS_PASIEN}
                      onChange={(e) => handleInputChange("JENIS_PASIEN", e.target.value)}
                    >
                      <FormControlLabel value="BARU" control={<Radio color="primary" />} label="Baru" />
                      <FormControlLabel value="LAMA" control={<Radio color="primary" />} label="Lama" />
                    </RadioGroup>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="NIP / NIK"
                    placeholder="Wajib diisi (Patuhi instruksi resepsionis)"
                    required
                    value={formData.NIP}
                    onChange={(e) => handleInputChange("NIP", e.target.value)}
                    helperText="Jika bukan karyawan, dapat menggunakan NIK"
                    InputProps={{ sx: { borderRadius: 2.5 } }}
                  />

                  <Box sx={{ pt: 2 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || isCalculating}
                      sx={{ 
                        py: 1.5, 
                        borderRadius: 3, 
                        fontWeight: 800, 
                        bgcolor: "#696CFF",
                        "&:hover": { bgcolor: "#5759E0" },
                        boxShadow: "0 4px 14px 0 rgba(105, 108, 255, 0.39)"
                      }}
                    >
                      {loading || isCalculating ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Daftar Sekarang"
                      )}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>
          </Fade>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Fade in={step === 3}>
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "#10B981", mb: 3 }} />
              <Typography variant="h5" fontWeight="900" gutterBottom>
                Pendaftaran Berhasil!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                Data Anda telah masuk ke sistem. Silakan lapor ke petugas/resepsionis untuk konfirmasi lebih lanjut.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => {
                  setStep(1);
                  setFormData({ NAMA: "", JENIS_KELAMIN: "L", USIA: "", JENIS_PASIEN: "BARU", NIP: "" });
                }}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
              >
                Kembali ke Beranda
              </Button>
            </Paper>
          </Fade>
        )}

        {/* Footer */}
        <Box sx={{ mt: 6, textAlign: "center", opacity: 0.6 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            &copy; 2026 RSUD — Sistem Pendaftaran Mandiri
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

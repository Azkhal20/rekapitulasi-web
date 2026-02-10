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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import { PatientData } from "@/services/patientService";
import { Patient } from "@/types/patient";

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PatientData, "id">) => Promise<void>;
  initialData?: PatientData | null;
  mode: "add" | "edit";
  defaultTahun?: string;
  existingPatients?: PatientData[] | Patient[]; // Use strict types if possible
  lastL?: string;
  lastP?: string;
}

// Helper: Convert "YYYY-MM-DD" to "DD MMM YYYY"
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
  } catch {
    // Ignore parsing errors
    return isoDate;
  }
};

// Helper: Convert "DD MMM YYYY" to "YYYY-MM-DD"
// Enhanced Parser to be more robust
const parseDateFromSheet = (displayDate: string): string => {
  if (!displayDate) return "";
  const cleanDate = displayDate.trim();

  // Already ISO?
  if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) return cleanDate;

  // Case insensitive & flexible map
  const MONTH_MAP: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    mei: "05",
    jun: "06",
    jul: "07",
    agu: "08",
    sep: "09",
    okt: "10",
    nov: "11",
    des: "12",
    januari: "01",
    februari: "02",
    maret: "03",
    april: "04",
    agustus: "08",
    september: "09",
    oktober: "10",
    november: "11",
    desember: "12",
  };

  try {
    // Split by any whitespace char (including non-breaking space)
    const parts = cleanDate.split(/\s+/);

    if (parts.length >= 3) {
      const day = parts[0].padStart(2, "0");
      const monthStr = parts[1].toLowerCase();
      const year = parts[2];

      let month = MONTH_MAP[monthStr];

      // Partial match fallback (e.g. "Febr")
      if (!month) {
        const key = Object.keys(MONTH_MAP).find(
          (k) => k.startsWith(monthStr) || monthStr.startsWith(k),
        );
        if (key) month = MONTH_MAP[key];
      }

      if (month) return `${year}-${month}-${day}`;
    }

    // Fallback JS Date parser
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  } catch {
    console.warn("Failed to parse date:", cleanDate);
  }
  return "";
};

const REFERRAL_CATEGORIES = [
  { label: "Tidak Ada Rujukan", value: "none" },
  {
    label: "Rujuk FASKES Pertama",
    value: "RUJUK_FASKES_PERTAMA",
    pb: "RUJUK_FASKES_PERTAMA_PB",
    pl: "RUJUK_FASKES_PERTAMA_PL",
  },
  {
    label: "Rujuk ke FKRTL (Rumah Sakit)",
    value: "RUJUK_FKRTL",
    pb: "RUJUK_FKRTL_PB",
    pl: "RUJUK_FKRTL_PL",
  },
  {
    label: "PTM Dirujuk ke FKRTL",
    value: "PTM_RUJUK_FKRTL",
    pb: "PTM_RUJUK_FKRTL_PB",
    pl: "PTM_RUJUK_FKRTL_PL",
  },
  {
    label: "Dirujuk Balik dari Puskesmas",
    value: "DIRUJUK_BALIK_PUSKESMAS",
    pb: "DIRUJUK_BALIK_PUSKESMAS_PB",
    pl: "DIRUJUK_BALIK_PUSKESMAS_PL",
  },
  {
    label: "Dirujuk Balik dari FKRTL",
    value: "DIRUJUK_BALIK_FKRTL",
    pb: "DIRUJUK_BALIK_FKRTL_PB",
    pl: "DIRUJUK_BALIK_FKRTL_PL",
  },
];

export default function PatientFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  defaultTahun,
  existingPatients = [],
  lastL = "",
  lastP = "",
}: PatientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReferralType, setActiveReferralType] = useState<string>("none");

  const [formData, setFormData] = useState<Omit<PatientData, "id">>({
    TANGGAL: "",
    TAHUN: "",
    BULAN: "",
    HARI: "",
    ENAM_BELAS_LIMA_BELAS: "",
    L: "",
    P: "",
    BARU: "",
    LAMA: "",
    NAMA: "",
    USIA: "",
    NIP: "",
    OBS_TTV: "",
    KELUHAN: "",
    DIAGNOSIS: "",
    ICD10: "",
    TINDAKAN: "",
    OBAT: "",
    // Referral fields
    RUJUK_FASKES_PERTAMA_PB: "",
    RUJUK_FASKES_PERTAMA_PL: "",
    RUJUK_FKRTL_PB: "",
    RUJUK_FKRTL_PL: "",
    PTM_RUJUK_FKRTL_PB: "",
    PTM_RUJUK_FKRTL_PL: "",
    DIRUJUK_BALIK_PUSKESMAS_PB: "",
    DIRUJUK_BALIK_PUSKESMAS_PL: "",
    DIRUJUK_BALIK_FKRTL_PB: "",
    DIRUJUK_BALIK_FKRTL_PL: "",
  });

  // Effect: Auto Calculate HARI, BULAN, and 16-15 when TANGGAL changes (Only in ADD mode)
  useEffect(() => {
    if (mode === "add" && formData.TANGGAL && open) {
      try {
        const inputDate = new Date(formData.TANGGAL);
        if (isNaN(inputDate.getTime())) return;

        const day = inputDate.getDate();
        const month = inputDate.getMonth();
        const year = inputDate.getFullYear();

        // Normalized Input Date String (YYYY-MM-DD from parser) to compare
        const inputDateStr = formData.TANGGAL; // Assume clean ISO

        // Cast to any[] once to avoid union type issues with heterogeneous keys
        const patients = (existingPatients as Record<string, unknown>[]) || [];

        // === 1. Auto Calc HARI (Reset per Hari) ===
        const recordsSameDay = patients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          return pDateIso === inputDateStr;
        });

        let nextHari = 1;
        if (recordsSameDay.length > 0) {
          const maxHari = Math.max(
            ...recordsSameDay.map((r) => parseInt(String(r.HARI || "0")) || 0),
          );
          nextHari = maxHari + 1;
        }

        // === 2. Auto Calc BULAN (Reset per Bulan) ===
        const recordsSameMonth = patients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          const pDate = new Date(pDateIso);
          return pDate.getFullYear() === year && pDate.getMonth() === month;
        });

        let nextBulan = 1;
        if (recordsSameMonth.length > 0) {
          const maxBulan = Math.max(
            ...recordsSameMonth.map(
              (r) => parseInt(String(r.BULAN || "0")) || 0,
            ),
          );
          nextBulan = maxBulan + 1;
        }

        // === 3. Auto Calc 16-15 (Reset Tgl 16) ===
        // Tentukan Awal Siklus (Cycle Start Date)
        let cycleStartTime: number;

        if (day >= 16) {
          // Siklus bulan ini, mulai tanggal 16
          cycleStartTime = new Date(year, month, 16).setHours(0, 0, 0, 0);
        } else {
          // Siklus bulan lalu, mulai tanggal 16 bulan lalu
          cycleStartTime = new Date(year, month - 1, 16).setHours(0, 0, 0, 0);
        }

        // Filter Existing Patients dalam siklus ini
        const recordsInCycle = patients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;

          const pDate = new Date(pDateIso);
          if (isNaN(pDate.getTime())) return false;

          // Compare Time
          return pDate.setHours(0, 0, 0, 0) >= cycleStartTime;
        });

        // Find Max Value in Cycle for 16-15
        let next1615 = 1;
        if (recordsInCycle.length > 0) {
          const maxVal = Math.max(
            ...recordsInCycle.map((r) => {
              const rawVal = r["16-15"] || r.ENAM_BELAS_LIMA_BELAS || "0";
              const val = parseInt(String(rawVal));
              return isNaN(val) ? 0 : val;
            }),
          );
          next1615 = maxVal + 1;
        } else {
          next1615 = 1;
        }

        // Update Form State (All fields at once to avoid flicker)
        setFormData((prev) => ({
          ...prev,
          HARI: nextHari.toString(),
          BULAN: nextBulan.toString(),
          ENAM_BELAS_LIMA_BELAS: next1615.toString(),
        }));
      } catch (e) {
        console.error("Auto calc error", e);
      }
    }
  }, [formData.TANGGAL, mode, open, existingPatients]);

  // Reset form
  useEffect(() => {
    if (open) {
      if (initialData && mode === "edit") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...rest } = initialData;
        const convertedData = { ...rest };
        if (convertedData.TANGGAL) {
          convertedData.TANGGAL = parseDateFromSheet(convertedData.TANGGAL);
        }

        // Detect active referral type for dropdown
        const found = REFERRAL_CATEGORIES.find(
          (cat) =>
            cat.value !== "none" &&
            (String(initialData[cat.pb as keyof PatientData] || "") ||
              String(initialData[cat.pl as keyof PatientData] || "")),
        );
        setActiveReferralType(found ? found.value : "none");

        setFormData({
          ...convertedData,
          BARU: String(initialData.BARU || ""),
          LAMA: String(initialData.LAMA || ""),
        });
      } else {
        // ADD Mode
        const now = new Date();
        const tanggal = now.toISOString().split("T")[0];
        const tahun = defaultTahun || now.getFullYear().toString();

        setActiveReferralType("none");
        setFormData({
          TANGGAL: tanggal,
          TAHUN: tahun,
          BULAN: "",
          HARI: "",
          ENAM_BELAS_LIMA_BELAS: "", // Auto-calc will fill this
          L: "",
          P: "",
          BARU: "",
          LAMA: "",
          NAMA: "",
          USIA: "",
          NIP: "",
          OBS_TTV: "",
          KELUHAN: "",
          DIAGNOSIS: "",
          ICD10: "",
          TINDAKAN: "",
          OBAT: "",
          // Referral fields
          RUJUK_FASKES_PERTAMA_PB: "",
          RUJUK_FASKES_PERTAMA_PL: "",
          RUJUK_FKRTL_PB: "",
          RUJUK_FKRTL_PL: "",
          PTM_RUJUK_FKRTL_PB: "",
          PTM_RUJUK_FKRTL_PL: "",
          DIRUJUK_BALIK_PUSKESMAS_PB: "",
          DIRUJUK_BALIK_PUSKESMAS_PL: "",
          DIRUJUK_BALIK_FKRTL_PB: "",
          DIRUJUK_BALIK_FKRTL_PL: "",
          BARU: "",
          LAMA: "",
        });
      }
      setError(null);
    }
  }, [open, initialData, mode, defaultTahun]);

  const handleChange = (
    field: keyof Omit<PatientData, "id">,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReferralTypeChange = (newType: string) => {
    setFormData((prev) => {
      const updated = { ...prev } as Record<string, string>;
      // Reset all referral fields using type-safe keys
      REFERRAL_CATEGORIES.forEach((cat) => {
        if (cat.pb) updated[cat.pb] = "";
        if (cat.pl) updated[cat.pl] = "";
      });
      return updated as unknown as Omit<PatientData, "id">;
    });
    setActiveReferralType(newType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dataToSubmit = { ...formData };
      if (dataToSubmit.TANGGAL) {
        dataToSubmit.TANGGAL = formatDateForSheet(dataToSubmit.TANGGAL);
      }
      await onSubmit(dataToSubmit);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menyimpan data.");
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
      PaperProps={{ sx: { borderRadius: 5 } }}
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

            {/* Tgl Section */}
            <TextField
              label="Tanggal"
              type="date"
              value={formData.TANGGAL}
              onChange={(e) => handleChange("TANGGAL", e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            {/* Urutan Baru: Tahun, Bulan, Hari, 16-15 */}
            <Stack
              direction="row"
              spacing={2}
              sx={{
                gridColumn: { xs: "1fr", sm: "span 2" },
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
              }}
            >
              <TextField
                label="Tahun"
                value={formData.TAHUN}
                onChange={(e) => handleChange("TAHUN", e.target.value)}
                helperText="*Auto +1"
              />
              <TextField
                label="Bulan"
                value={formData.BULAN}
                onChange={(e) => handleChange("BULAN", e.target.value)}
                helperText="*Auto Reset /Bulan"
                placeholder="Auto"
                focused={mode === "add"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: mode === "add" ? "#F0F9FF" : "inherit",
                  },
                }}
              />
              <TextField
                label="Hari"
                value={formData.HARI}
                onChange={(e) => handleChange("HARI", e.target.value)}
                helperText="*Auto Reset /Hari"
                placeholder="Auto"
                focused={mode === "add"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: mode === "add" ? "#F0F9FF" : "inherit",
                  },
                }}
              />
              <TextField
                label="16-15"
                value={formData.ENAM_BELAS_LIMA_BELAS}
                onChange={(e) =>
                  handleChange("ENAM_BELAS_LIMA_BELAS", e.target.value)
                }
                helperText="*Auto Reset Tanggal 16"
                focused={mode === "add"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: mode === "add" ? "#F0F9FF" : "inherit",
                  },
                }}
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
                placeholder={lastL || "0"}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Perempuan (P)"
                value={formData.P}
                onChange={(e) => handleChange("P", e.target.value)}
                fullWidth
                placeholder={lastP || "0"}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Baru (Pasien Baru)"
                value={formData.BARU}
                onChange={(e) => handleChange("BARU", e.target.value)}
                fullWidth
                placeholder="Isi 1 jika pasien baru"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Lama (Pasien Lama)"
                value={formData.LAMA}
                onChange={(e) => handleChange("LAMA", e.target.value)}
                fullWidth
                placeholder="Isi 1 jika pasien lama"
                InputLabelProps={{ shrink: true }}
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
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <EditNoteIcon /> DATA MEDIS
              </Typography>
            </Box>

            <TextField
              label="OBS TTV"
              value={formData.OBS_TTV}
              onChange={(e) => handleChange("OBS_TTV", e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="TD, Nadi, Suhu, RR, dll"
              sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}
            />

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
              placeholder="Kode ICD-10"
            />

            <TextField
              label="Tindakan"
              value={formData.TINDAKAN}
              onChange={(e) => handleChange("TINDAKAN", e.target.value)}
              fullWidth
              placeholder="Terapi Medis / Tindakan"
            />

            <TextField
              label="Obat / Terapi"
              value={formData.OBAT}
              onChange={(e) => handleChange("OBAT", e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Rincian obat yang diberikan"
              sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}
            />

            {/* Data Rujukan Section */}
            <Box sx={{ gridColumn: { xs: "1fr", sm: "span 2" }, mt: 1 }}>
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <SendIcon /> DATA RUJUKAN
              </Typography>
            </Box>

            <Box sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}>
              <FormControl fullWidth sx={{ mb: activeReferralType !== "none" ? 2 : 0 }}>
                <InputLabel id="referral-type-label">Pilih Jenis Rujukan</InputLabel>
                <Select
                  labelId="referral-type-label"
                  value={activeReferralType}
                  label="Pilih Jenis Rujukan"
                  onChange={(e) => handleReferralTypeChange(e.target.value)}
                  sx={{ borderRadius: "12px" }}
                >
                  {REFERRAL_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {activeReferralType !== "none" && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "16px",
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    animation: "fadeIn 0.3s ease-out",
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateY(-10px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1.5, display: "block" }}
                  >
                    INPUT NILAI RUJUKAN (
                    {
                      REFERRAL_CATEGORIES.find(
                        (c) => c.value === activeReferralType,
                      )?.label
                    }
                    )
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {(() => {
                      const activeCat = REFERRAL_CATEGORIES.find(
                        (c) => c.value === activeReferralType,
                      );
                      return (
                        <>
                          <TextField
                            label="PB (Pasien Baru)"
                            value={
                              activeCat?.pb
                                ? (formData[
                                    activeCat.pb as keyof typeof formData
                                  ] as string) || ""
                                : ""
                            }
                            onChange={(e) =>
                              activeCat?.pb &&
                              handleChange(
                                activeCat.pb as keyof typeof formData,
                                e.target.value,
                              )
                            }
                            fullWidth
                            placeholder="Isi 1 jika pasien rujukan baru"
                            focused
                            size="small"
                          />
                          <TextField
                            label="PL (Pasien Lama)"
                            value={
                              activeCat?.pl
                                ? (formData[
                                    activeCat.pl as keyof typeof formData
                                  ] as string) || ""
                                : ""
                            }
                            onChange={(e) =>
                              activeCat?.pl &&
                              handleChange(
                                activeCat.pl as keyof typeof formData,
                                e.target.value,
                              )
                            }
                            fullWidth
                            placeholder="Isi 1 jika pasien rujukan lama"
                            focused
                            size="small"
                          />
                        </>
                      );
                    })()}
                  </Stack>
                </Box>
              )}
            </Box>
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

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
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import icd10Data from "@/data/icd10.json";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import { PatientData, PoliType } from "@/services/patientService";

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PatientData, "id">) => Promise<void>;
  initialData?: PatientData | null;
  mode: "add" | "edit";
  lastL?: string;
  lastP?: string;
  poliType: PoliType;
}

interface ICD10Entry {
  CODE: string;
  DISPLAY: string;
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
  lastL = "",
  lastP = "",
  poliType,
}: PatientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate states for computed auto values
  const [autoValues, setAutoValues] = useState({
    TAHUN: "",
    BULAN: "",
    HARI: "",
    ENAM_BELAS_LIMA_BELAS: "",
  });

  const [formData, setFormData] = useState<Omit<PatientData, "id">>({
    TANGGAL: "",
    TAHUN: "",
    BULAN: "",
    HARI: "",
    ENAM_BELAS_LIMA_BELAS: "",
    "16-15": "",
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

  // Effect: Auto Calculate Cross-Sheet Sequence values when TANGGAL changes (Only in ADD mode)
  useEffect(() => {
    let isMounted = true;

    const fetchAndCalculate = async () => {
      if (mode !== "add" || !formData.TANGGAL || !open) return;
      setIsCalculating(true);

      try {
        const inputDate = parseDateFromSheet(formData.TANGGAL); // Converts to ISO YYYY-MM-DD reliably
        if (!inputDate) return;

        const dateObj = new Date(inputDate);
        if (isNaN(dateObj.getTime())) return;

        const day = dateObj.getDate();
        const monthIndex = dateObj.getMonth(); // 0 is Jan, 11 is Dec
        const year = dateObj.getFullYear();

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

        const currentSheetName = `${MONTHS[monthIndex]} ${year}`;

        // Determine previous month sheet (for TAHUN continuation and 16-15 cross-month)
        let prevMonthIndex = monthIndex - 1;
        let prevYear = year;
        if (prevMonthIndex < 0) {
          prevMonthIndex = 11;
          prevYear = year - 1;
        }
        const prevSheetName = `${MONTHS[prevMonthIndex]} ${prevYear}`;

        // 1. Fetch current month and previous month data silently.
        // We will fetch current and previous sheets silently to guarantee the data is accurate across sheets
        // bypassing the currently viewed sheet boundaries.

        const fetchSilently = async (sName: string) => {
          try {
            const { patientService } =
              await import("@/services/patientService");
            return await patientService.getAllPatients(sName, poliType);
          } catch {
            return []; // Fails if sheet doesn't exist yet
          }
        };

        const [currPatientsRaw, prevPatientsRaw] = await Promise.all([
          fetchSilently(currentSheetName),
          fetchSilently(prevSheetName),
        ]);

        if (!isMounted) return;

        const currPatients = currPatientsRaw as unknown as Record<
          string,
          unknown
        >[];
        const prevPatients = prevPatientsRaw as unknown as Record<
          string,
          unknown
        >[];

        // Combine for 16-15 calc
        const allRelevantPatients = [...prevPatients, ...currPatients];

        // 1. HARI (Reset per Hari within current month)
        const recordsSameDay = currPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          return pDateIso === inputDate;
        });

        let nextHari = 1;
        if (recordsSameDay.length > 0) {
          const maxHari = Math.max(
            ...recordsSameDay.map((r) => parseInt(String(r.HARI || "0")) || 0),
          );
          nextHari = maxHari + 1;
        }

        // 2. BULAN (Reset per Bulan within current month)
        const recordsSameMonth = currPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          const pDate = new Date(pDateIso);
          return (
            pDate.getFullYear() === year && pDate.getMonth() === monthIndex
          );
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

        // 3. TAHUN (Reset per Tahun, absolute count for the year)
        // Look at current month first
        let nextTahun = 1;
        if (currPatients.length > 0) {
          // find max TAHUN in current month
          const maxTahunCurr = Math.max(
            ...currPatients.map((r) => parseInt(String(r.TAHUN || "0")) || 0),
          );
          if (maxTahunCurr > 0) nextTahun = maxTahunCurr + 1;
        }

        if (nextTahun === 1 && prevPatients.length > 0 && monthIndex !== 0) {
          // if current month is empty, and it is NOT january, continue from previous month's max TAHUN
          const prevYearData = prevPatients.filter((p) => {
            const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
            if (!pDateIso) return false;
            return new Date(pDateIso).getFullYear() === year; // only consider same year
          });
          if (prevYearData.length > 0) {
            const maxTahunPrev = Math.max(
              ...prevYearData.map((r) => parseInt(String(r.TAHUN || "0")) || 0),
            );
            if (maxTahunPrev > 0) nextTahun = maxTahunPrev + 1;
          }
        }

        // 4. 16-15 (Reset Tgl 16 cross-month)
        let cycleStartTime: number;
        if (day >= 16) {
          // cycle starts 16 current month
          cycleStartTime = new Date(year, monthIndex, 16).setHours(0, 0, 0, 0);
        } else {
          // cycle starts 16 prev month
          cycleStartTime = new Date(year, monthIndex - 1, 16).setHours(
            0,
            0,
            0,
            0,
          );
        }

        const recordsInCycle = allRelevantPatients.filter((p) => {
          const pDateIso = parseDateFromSheet(String(p.TANGGAL || ""));
          if (!pDateIso) return false;
          const pDate = new Date(pDateIso);
          if (isNaN(pDate.getTime())) return false;
          return pDate.setHours(0, 0, 0, 0) >= cycleStartTime;
        });

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
        }

        // Set Computed Auto Values correctly as Placeholders
        setAutoValues({
          TAHUN: nextTahun.toString(),
          BULAN: nextBulan.toString(),
          HARI: nextHari.toString(),
          ENAM_BELAS_LIMA_BELAS: next1615.toString(),
        });
      } catch (e) {
        console.error("Auto calc error", e);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    };

    fetchAndCalculate();
    return () => {
      isMounted = false;
    };
  }, [formData.TANGGAL, mode, open, poliType]);

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

        setFormData({
          ...convertedData,
          BARU: String(initialData.BARU || ""),
          LAMA: String(initialData.LAMA || ""),
        });
      } else {
        // ADD Mode
        const now = new Date();
        const tanggal = now.toISOString().split("T")[0];

        setFormData({
          TANGGAL: tanggal,
          TAHUN: "", // Kept empty so AutoValues logic generates the placeholder
          BULAN: "",
          HARI: "",
          ENAM_BELAS_LIMA_BELAS: "",
          "16-15": "",
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
      }
      setError(null);
    }
  }, [open, initialData, mode]);

  const handleChange = (
    field: keyof Omit<PatientData, "id">,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dataToSubmit = { ...formData };

      // Fallback to autoValues if field is empty (user didn't override placeholder)
      if (!dataToSubmit.TAHUN) dataToSubmit.TAHUN = autoValues.TAHUN;
      if (!dataToSubmit.BULAN) dataToSubmit.BULAN = autoValues.BULAN;
      if (!dataToSubmit.HARI) dataToSubmit.HARI = autoValues.HARI;
      if (!dataToSubmit.ENAM_BELAS_LIMA_BELAS)
        dataToSubmit.ENAM_BELAS_LIMA_BELAS = autoValues.ENAM_BELAS_LIMA_BELAS;
      
      // Ensure "16-15" is also set for TS compliance
      dataToSubmit["16-15"] = dataToSubmit.ENAM_BELAS_LIMA_BELAS;

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
                helperText="*Auto akumulasi tahun"
                placeholder={isCalculating ? "Tunggu..." : autoValues.TAHUN}
                focused={mode === "add"}
                InputProps={{
                  endAdornment: isCalculating && <CircularProgress size={16} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      mode === "add" && !formData.TAHUN ? "#F0F9FF" : "inherit",
                  },
                }}
              />
              <TextField
                label="Bulan"
                value={formData.BULAN}
                onChange={(e) => handleChange("BULAN", e.target.value)}
                helperText="*Auto reset /bulan"
                placeholder={isCalculating ? "Tunggu..." : autoValues.BULAN}
                focused={mode === "add"}
                InputProps={{
                  endAdornment: isCalculating && <CircularProgress size={16} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      mode === "add" && !formData.BULAN ? "#F0F9FF" : "inherit",
                  },
                }}
              />
              <TextField
                label="Hari"
                value={formData.HARI}
                onChange={(e) => handleChange("HARI", e.target.value)}
                helperText="*Auto reset /hari"
                placeholder={isCalculating ? "Tunggu..." : autoValues.HARI}
                focused={mode === "add"}
                InputProps={{
                  endAdornment: isCalculating && <CircularProgress size={16} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      mode === "add" && !formData.HARI ? "#F0F9FF" : "inherit",
                  },
                }}
              />
              <TextField
                label="16-15"
                value={formData.ENAM_BELAS_LIMA_BELAS}
                onChange={(e) =>
                  handleChange("ENAM_BELAS_LIMA_BELAS", e.target.value)
                }
                helperText="*Auto reset tgl 16"
                placeholder={
                  isCalculating ? "Tunggu..." : autoValues.ENAM_BELAS_LIMA_BELAS
                }
                focused={mode === "add"}
                InputProps={{
                  endAdornment: isCalculating && <CircularProgress size={16} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      mode === "add" && !formData.ENAM_BELAS_LIMA_BELAS
                        ? "#F0F9FF"
                        : "inherit",
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

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ gridColumn: { xs: "1fr", sm: "span 2" } }}
            >
              <Autocomplete
                freeSolo
                fullWidth
                options={icd10Data as ICD10Entry[]}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return `${option.CODE} - ${option.DISPLAY}`;
                }}
                filterOptions={(options, state) => {
                  // Mengambil term pencarian hanya dari baris terakhir (setelah nomor)
                  const lines = state.inputValue.split("\n");
                  const currentLine = lines[lines.length - 1] || "";
                  const searchTerm = currentLine
                    .replace(/^\d+\.\s*/, "")
                    .trim();

                  return createFilterOptions<ICD10Entry>({
                    stringify: (option: ICD10Entry) =>
                      `${option.CODE} ${option.DISPLAY}`,
                    limit: 4000,
                  })(options as ICD10Entry[], {
                    ...state,
                    inputValue: searchTerm,
                  });
                }}
                value={formData.DIAGNOSIS}
                onInputChange={(event, newInputValue, reason) => {
                  // Hanya update saat mengetik manual
                  if (reason === "input") {
                    handleChange("DIAGNOSIS", newInputValue);
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === "string") {
                    setFormData((prev) => ({
                      ...prev,
                      DIAGNOSIS: newValue,
                    }));
                  } else if (newValue && typeof newValue === "object") {
                    const entry = newValue as ICD10Entry;

                    setFormData((prev) => {
                      const currentDiag = prev.DIAGNOSIS;
                      const currentICD = prev.ICD10;

                      // 1. Pecah menjadi baris-baris
                      const lines = currentDiag.split("\n");

                      // 2. Ambil baris terakhir (tempat user sedang mengetik pencarian)
                      const lastLine = lines.pop() || "";

                      // 3. Cek apakah baris terakhir sudah memiliki format nomor "X. "
                      const match = lastLine.match(/^(\d+\.\s*)/);

                      // Jika sudah ada nomornya, gunakan nomor itu.
                      // Jika belum ada nomornya, berikan nomor lanjutan atau nomor 1
                      const prefix = match
                        ? match[1]
                        : lines.length > 0
                          ? `${lines.length + 1}. `
                          : "1. ";

                      // 4. Masukkan kembali baris tersebut dengan membuang term pengetikan (misal 'z0')
                      lines.push(`${prefix}${entry.DISPLAY}`);

                      // 5. Gabungkan kembali (tidak ditambah baris baru / nomor otomatis)
                      const updatedDiag = lines.join("\n");

                      // 6. Update ICD-10 (tumpuk dengan koma)
                      const existingCodes = currentICD
                        ? currentICD
                            .split(/,\s*/)
                            .filter((c) => c.trim() !== "")
                        : [];
                      existingCodes.push(entry.CODE);
                      const updatedICD = existingCodes.join(", ");

                      return {
                        ...prev,
                        DIAGNOSIS: updatedDiag,
                        ICD10: updatedICD,
                      };
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Diagnosis"
                    placeholder="Ketik diagnosis atau kode ICD-10"
                    multiline
                    rows={3}
                    onKeyDown={(e) => {
                      // Logic Enter: Tambah nomor otomatis jika dropdown sedang tertutup
                      if (e.key === "Enter" && !e.shiftKey) {
                        const lines = formData.DIAGNOSIS.split("\n").filter(
                          (l) => l.trim() !== "",
                        );
                        if (lines.length > 0) {
                          e.preventDefault();
                          const nextNum = lines.length + 1;
                          const hasTrailingNumber = /^\d+\.\s*$/.test(
                            lines[lines.length - 1],
                          );

                          if (!hasTrailingNumber) {
                            setFormData((prev) => ({
                              ...prev,
                              DIAGNOSIS:
                                prev.DIAGNOSIS.trimEnd() + `\n${nextNum}. `,
                            }));
                          }
                        }
                      }
                    }}
                  />
                )}
                sx={{ flexGrow: 1 }}
              />

              <TextField
                label="ICD-10 (Kode)"
                value={formData.ICD10}
                onChange={(e) => handleChange("ICD10", e.target.value)}
                placeholder="Kode"
                multiline
                rows={2}
                sx={{ width: { xs: "100%", sm: "180px" } }}
                helperText="Auto / Manual"
              />
            </Stack>

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
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                {REFERRAL_CATEGORIES.filter((cat) => cat.value !== "none").map(
                  (cat) => (
                    <Box
                      key={cat.value}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        sx={{ mb: 1, display: "block", fontSize: "0.7rem" }}
                      >
                        {cat.label.toUpperCase()}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="PB"
                          value={
                            (formData[
                              cat.pb as keyof typeof formData
                            ] as string) || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              cat.pb as keyof typeof formData,
                              e.target.value,
                            )
                          }
                          fullWidth
                          size="small"
                          placeholder="Pasien Baru"
                        />
                        <TextField
                          label="PL"
                          value={
                            (formData[
                              cat.pl as keyof typeof formData
                            ] as string) || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              cat.pl as keyof typeof formData,
                              e.target.value,
                            )
                          }
                          fullWidth
                          size="small"
                          placeholder="Pasien Lama"
                        />
                      </Stack>
                    </Box>
                  ),
                )}
              </Box>
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

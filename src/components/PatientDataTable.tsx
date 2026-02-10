"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Tooltip,
  Checkbox,
  Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CheckboxIcon from "@mui/icons-material/CheckBox";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import { Patient } from "@/types/patient";
import PatientFormDialog from "./PatientFormDialog";
import { PatientData, PoliType } from "@/services/patientService";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { usePatientMutations } from "@/hooks/usePatients";
import { PatientSchema } from "@/schemas/patientSchema";
import { usePermissions } from "@/hooks/usePermissions";

const MySwal = withReactContent(Swal);

// Konfigurasi SweetAlert2 Toast
const Toast = MySwal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// Kolom yang TIDAK bisa diurutkan
const NON_SORTABLE_COLUMNS = [
  "NAMA",
  "NIP",
  "OBS TTV",
  "KELUHAN",
  "DIAGNOSIS",
  "ICD-10",
  "ICD10",
  "TINDAKAN",
  "TINDAKAN ",
  "OBAT",
];

// Kolom yang diizinkan untuk difilter
const FILTER_WHITELIST = ["DIAGNOSIS", "ICD-10", "TINDAKAN", "OBAT", "TANGGAL"];

interface PatientDataTableProps {
  data: Patient[] | PatientData[]; // Mendukung kedua tipe
  onDataChange?: () => void;
  sheetName: string; // Untuk tahu sheet bulan apa yang diedit
  poliType: PoliType; // Untuk tahu API poli mana yang dipanggil
}

// Fungsi bantu untuk akses properti dengan aman
function getRowValue(
  row: Patient | PatientData,
  column: string,
): string | number {
  return (row as Record<string, unknown>)[column] as string | number;
}

export default function PatientDataTable({
  data,
  onDataChange,
  sheetName,
  poliType,
}: PatientDataTableProps) {
  const { canCreate, canEdit, canDelete } = usePermissions();

  // State tabel
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  // State CRUD (Tambah/Edit)
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // React Query Mutations
  const { addMutation, updateMutation, deleteMutation, deleteBulkMutation } =
    usePatientMutations(sheetName, poliType);

  const [nextTahun, setNextTahun] = useState<string>("1");

  // Ambil nama kolom dari baris data pertama
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((key) => key !== "id");
  }, [data]);

  // Kolom default jika data kosong (untuk menampilkan header)
  const effectiveColumns = useMemo(() => {
    if (columns.length > 0) return columns;
    // Default urutan header sesuai Google Sheet (termasuk rujukan)
    return [
      "TANGGAL",
      "HARI",
      "BULAN",
      "TAHUN",
      "16-15",
      "L",
      "P",
      "BARU",
      "LAMA",
      "NAMA",
      "USIA",
      "NIP",
      "OBS TTV",
      "KELUHAN",
      "DIAGNOSIS",
      "ICD-10",
      "TINDAKAN",
      "OBAT",
      "RUJUK_FASKES_PERTAMA_PB",
      "RUJUK_FASKES_PERTAMA_PL",
      "RUJUK_FKRTL_PB",
      "RUJUK_FKRTL_PL",
      "PTM_RUJUK_FKRTL_PB",
      "PTM_RUJUK_FKRTL_PL",
      "DIRUJUK_BALIK_PUSKESMAS_PB",
      "DIRUJUK_BALIK_PUSKESMAS_PL",
      "DIRUJUK_BALIK_FKRTL_PB",
      "DIRUJUK_BALIK_FKRTL_PL",
    ];
  }, [columns]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "-";
      if (/[a-zA-Z]/.test(dateString)) return dateString;

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Parsing tanggal Indonesia (DD-MM-YYYY atau DD Bulan YYYY)
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr || dateStr === "-" || dateStr === "") return new Date(0);

    const cleanStr = dateStr.trim();

    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) return d;

    const parts = cleanStr.split(/[\s-/]+/);

    if (parts.length >= 3) {
      let day: number, monthIndex: number | undefined, year: number;

      if (parts[0].length === 4 && !isNaN(parseInt(parts[0]))) {
        year = parseInt(parts[0]);
        monthIndex = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        day = parseInt(parts[0]);
        const monthRaw = parts[1].toLowerCase();
        year = parseInt(parts[2]);

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
        return new Date(year, monthIndex, day);
      }
    }

    return new Date(0);
  };

  const getUniqueValues = (column: string) => {
    let values = data
      .map((row) => String(getRowValue(row, column) || ""))
      .filter(Boolean);

    values = Array.from(new Set(values));

    if (column === "TANGGAL") {
      return values.sort((a, b) => {
        const dateA = parseLocalDate(a);
        const dateB = parseLocalDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return values.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  };

  // Fungsi untuk menentukan lebar kolom berdasarkan tipe data
  const getColumnWidth = (column: string): number | string => {
    const widthMap: Record<string, number | string> = {
      // Kolom kecil (angka/short text)
      TAHUN: 65,
      BULAN: 85,
      HARI: 70,
      "16-15": 70,
      L: 55,
      P: 55,
      BARU: 75,
      LAMA: 75,
      USIA: 70,

      // Kolom sedang
      TANGGAL: 125,
      "ICD-10": 120, // Diperbesar
      ICD10: 120, // Diperbesar

      // Kolom besar (nama dan identitas)
      NAMA: 220, // Diperbesar untuk nama panjang
      NIP: 220, // Diperbesar untuk NIP panjang

      // Kolom sangat besar (teks panjang)
      "OBS TTV": 250,
      KELUHAN: 350, // Diperbesar
      DIAGNOSIS: 220,
      TINDAKAN: 220,
      "TINDAKAN ": 220,
      OBAT: 300, // Diperbesar untuk daftar obat panjang

      // Kolom Rujukan (PB/PL)
      RUJUK_FASKES_PERTAMA_PB: 70,
      RUJUK_FASKES_PERTAMA_PL: 70,
      RUJUK_FKRTL_PB: 70,
      RUJUK_FKRTL_PL: 70,
      PTM_RUJUK_FKRTL_PB: 70,
      PTM_RUJUK_FKRTL_PL: 70,
      DIRUJUK_BALIK_PUSKESMAS_PB: 70,
      DIRUJUK_BALIK_PUSKESMAS_PL: 70,
      DIRUJUK_BALIK_FKRTL_PB: 70,
      DIRUJUK_BALIK_FKRTL_PL: 70,
    };

    return widthMap[column] || 150;
  };

  // Semua kolom menggunakan left alignment
  const getColumnAlign = (): "left" | "center" | "right" => {
    return "left";
  };

  // Filtering dan sorting data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter Pencarian
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(query),
        ),
      );
    }

    // Filter Kolom
    if (filterColumn && filterValue) {
      result = result.filter(
        (row) => String(getRowValue(row, filterColumn)) === filterValue,
      );
    }

    // Logika Pengurutan
    if (sortColumn) {
      result.sort((a, b) => {
        const aValRaw = getRowValue(a, sortColumn);
        const bValRaw = getRowValue(b, sortColumn);

        const aValue = String(aValRaw || "");
        const bValue = String(bValRaw || "");

        let comparison = 0;

        // Pengurutan Tanggal Khusus
        if (sortColumn === "TANGGAL") {
          const dateA = parseLocalDate(aValue);
          const dateB = parseLocalDate(bValue);
          comparison = dateA.getTime() - dateB.getTime();

          // Jika tanggal sama, urutkan berdasarkan ID sebagai fallback
          if (comparison === 0) {
            const idA = Number((a as Record<string, unknown>).id) || 0;
            const idB = Number((b as Record<string, unknown>).id) || 0;
            comparison = idA - idB;
          }
        }
        // Pengurutan Angka (misal USIA, NO)
        else {
          // Cek apakah keduanya angka murni
          const numA = parseFloat(aValue);
          const numB = parseFloat(bValue);

          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
          } else {
            // Sort string dengan 'numeric aware' (menangani "1" atau "01", "2" atau "10")
            comparison = aValue.localeCompare(bValue, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          }
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, filterColumn, filterValue, sortColumn, sortDirection]);

  // Pagination Data
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedData.slice(start, start + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn("");
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleShowLatest = () => {
    setSortColumn("TANGGAL");
    setSortDirection("desc");
    setPage(0);

    Toast.fire({
      icon: "info",
      title: "Menampilkan data paling terbaru",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterColumn("");
    setFilterValue("");
    setSortColumn("");
    setSortDirection("asc");
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Selection Logic
  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === filteredAndSortedData.length) {
      setSelectedIds([]);
    } else {
      const allIds = filteredAndSortedData.map(
        (row) => Number((row as any).id) || 0,
      );
      setSelectedIds(allIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    MySwal.fire({
      title: "Hapus Data?",
      text: `Anda akan menghapus ${selectedIds.length} data pasien sekaligus. Tindakan ini tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF4C51",
      cancelButtonColor: "#8592A3",
      confirmButtonText: "Ya, Hapus Semua!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          MySwal.fire({
            title: "Menghapus...",
            text: `Sedang menghapus ${selectedIds.length} data`,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          await deleteBulkMutation.mutateAsync(selectedIds);

          Swal.close();
          Toast.fire({
            icon: "success",
            title: `${selectedIds.length} data pasien berhasil dihapus`,
          });

          setSelectedIds([]);
          if (onDataChange) onDataChange();
        } catch (error) {
          console.error("Bulk delete error:", error);
          Swal.close();
          Toast.fire({
            icon: "error",
            title: "Gagal menghapus data secara masal",
          });
        }
      }
    });
  };

  // Handler CRUD
  const handleAddPatient = () => {
    // LOGIKA: Ambil nomor urut terakhir + 1
    let nextNum = "1";
    if (data.length > 0) {
      // Sort berdasarkan ID descending untuk dapat entry terakhir
      const sorted = [...data].sort((a, b) => {
        const idA = Number((a as Record<string, unknown>).id) || 0;
        const idB = Number((b as Record<string, unknown>).id) || 0;
        return idB - idA;
      });
      const lastEntry = sorted[0] as Record<string, unknown>;

      const lastTahun = lastEntry.TAHUN;

      if (lastEntry && lastTahun) {
        const lastVal = parseInt(String(lastTahun));
        if (!isNaN(lastVal)) {
          nextNum = (lastVal + 1).toString();
        }
      }
    }
    setNextTahun(nextNum);
    setFormMode("add");
    setSelectedPatient(null);
    setFormDialogOpen(true);
  };

  // Hitung Nilai L dan P Terakhir untuk Placeholder
  const { lastL, lastP } = useMemo(() => {
    let lVal = "";
    let pVal = "";

    if (data && data.length > 0) {
      // Sort entry by ID desc (newests first)
      const sorted = [...data].sort((a, b) => {
        const idA = Number(getRowValue(a, "id")) || 0;
        const idB = Number(getRowValue(b, "id")) || 0;
        return idB - idA;
      });

      // Find first non-empty L
      const foundL = sorted.find((row) => {
        const val = String(getRowValue(row, "L") || "").trim();
        return val !== "";
      });
      if (foundL) lVal = String(getRowValue(foundL, "L"));

      // Find first non-empty P
      const foundP = sorted.find((row) => {
        const val = String(getRowValue(row, "P") || "").trim();
        return val !== "";
      });
      if (foundP) pVal = String(getRowValue(foundP, "P"));
    }

    return { lastL: lVal, lastP: pVal };
  }, [data]);

  const handleEditPatient = (patient: Patient | PatientData) => {
    setNextTahun("");
    setFormMode("edit");

    const p = patient as Record<string, unknown>;

    // PERBAIKAN MAPPING: Sesuaikan dengan Key dari Google Sheet JSON
    const patientData: PatientData = {
      id: p.id as number,
      TANGGAL: String(p.TANGGAL || ""),
      TAHUN: String(p.TAHUN || ""),
      BULAN: String(p.BULAN || ""),
      HARI: String(p.HARI || ""),
      ENAM_BELAS_LIMA_BELAS: String(
        p["16-15"] || p.ENAM_BELAS_LIMA_BELAS || "",
      ),
      L: String(p.L || ""),
      P: String(p.P || ""),
      BARU: String(p.BARU || ""),
      LAMA: String(p.LAMA || ""),
      NAMA: String(p.NAMA || ""),
      USIA: String(p.USIA || ""),
      NIP: String(p.NIP || ""),
      OBS_TTV: String(p["OBS TTV"] || p.OBS_TTV || ""),
      KELUHAN: String(p.KELUHAN || ""),
      DIAGNOSIS: String(p.DIAGNOSIS || ""),
      // Mapping robust untuk ICD-10 dan TINDAKAN
      ICD10: String(p["ICD-10"] || p["ICD 10"] || p.ICD10 || ""),
      TINDAKAN: String(p["TINDAKAN"] || p["TINDAKAN "] || p.TINDAKAN || ""),
      OBAT: String(p.OBAT || ""),
      // Mapping untuk kolom rujukan
      RUJUK_FASKES_PERTAMA_PB: String(p.RUJUK_FASKES_PERTAMA_PB || ""),
      RUJUK_FASKES_PERTAMA_PL: String(p.RUJUK_FASKES_PERTAMA_PL || ""),
      RUJUK_FKRTL_PB: String(p.RUJUK_FKRTL_PB || ""),
      RUJUK_FKRTL_PL: String(p.RUJUK_FKRTL_PL || ""),
      PTM_RUJUK_FKRTL_PB: String(p.PTM_RUJUK_FKRTL_PB || ""),
      PTM_RUJUK_FKRTL_PL: String(p.PTM_RUJUK_FKRTL_PL || ""),
      DIRUJUK_BALIK_PUSKESMAS_PB: String(p.DIRUJUK_BALIK_PUSKESMAS_PB || ""),
      DIRUJUK_BALIK_PUSKESMAS_PL: String(p.DIRUJUK_BALIK_PUSKESMAS_PL || ""),
      DIRUJUK_BALIK_FKRTL_PB: String(p.DIRUJUK_BALIK_FKRTL_PB || ""),
      DIRUJUK_BALIK_FKRTL_PL: String(p.DIRUJUK_BALIK_FKRTL_PL || ""),
    };

    setSelectedPatient(patientData);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (formData: Omit<PatientData, "id">) => {
    // 1. Zod Validation
    const validationResult = PatientSchema.safeParse(formData);

    if (!validationResult.success) {
      // Gather error messages
      const errors = validationResult.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");

      Toast.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: errors || "Cek kembali data inputan Anda.",
      });
      return;
    }

    try {
      MySwal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Prepare Payload (similar mapping logic if needed,
      // though Schema helps ensure structure)
      // We still need mapping for custom keys like "OBS TTV" if backend requires spaces
      // BUT Zod schema already has keys defined.
      // If backend expects "OBS TTV" but frontend uses "OBS_TTV", we need to map.
      // The current frontend uses "OBS_TTV", Zod uses "OBS_TTV" (optional).

      // Let's stick to the mapping logic for backend compatibility from the previous code
      const payload: Record<string, unknown> = { ...formData };

      if (formData.OBS_TTV) {
        payload["OBS TTV"] = formData.OBS_TTV;
        delete payload.OBS_TTV;
      }
      if (formData.ICD10) {
        payload["ICD-10"] = formData.ICD10;
        delete payload.ICD10;
      }
      if (formData.ENAM_BELAS_LIMA_BELAS) {
        payload["16-15"] = formData.ENAM_BELAS_LIMA_BELAS;
        delete payload.ENAM_BELAS_LIMA_BELAS;
      }

      // Safety defaults
      payload["OBS TTV"] = payload["OBS TTV"] || "";
      payload["ICD-10"] = payload["ICD-10"] || "";
      payload["16-15"] = payload["16-15"] || "";
      payload["TINDAKAN"] = formData.TINDAKAN || "";
      payload["TINDAKAN "] = formData.TINDAKAN || "";

      if (formMode === "add") {
        await addMutation.mutateAsync(
          payload as unknown as Omit<PatientData, "id">,
        );

        Swal.close();
        Toast.fire({
          icon: "success",
          title: "Data pasien berhasil ditambahkan",
        });
      } else {
        if (selectedPatient?.id) {
          await updateMutation.mutateAsync({
            id: selectedPatient.id,
            data: payload as unknown as Omit<PatientData, "id">,
          });

          Swal.close();
          Toast.fire({
            icon: "success",
            title: "Data pasien berhasil diperbarui",
          });
        }
      }

      setFormDialogOpen(false);
      setSelectedPatient(null);
      if (onDataChange) onDataChange();
    } catch (error) {
      Swal.close();
      Toast.fire({
        icon: "error",
        title: `Gagal ${
          formMode === "add" ? "menambahkan" : "memperbarui"
        } data pasien`,
      });
      console.error(error);
    }
  };

  return (
    <Box>
      {/* Table Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 3,
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleShowLatest}
          startIcon={<HistoryIcon />}
          sx={{
            borderColor: "#696CFF",
            color: "#696CFF",
            "&:hover": {
              borderColor: "#5f61e6",
              backgroundColor: "rgba(105, 108, 255, 0.08)",
            },
            boxShadow: "0 2px 4px 0 rgba(105, 108, 255, 0.4)",
            px: 3,
          }}
        >
          DATA TERBARU
        </Button>
        {canCreate && (
          <Button
            variant="contained"
            onClick={handleAddPatient}
            startIcon={
              <Box component="span" sx={{ fontSize: "1.2em" }}>
                +
              </Box>
            }
            sx={{
              backgroundColor: "#696CFF",
              "&:hover": { backgroundColor: "#5f61e6" },
              boxShadow: "0 2px 4px 0 rgba(105, 108, 255, 0.4)",
              px: 3,
            }}
          >
            TAMBAH PASIEN
          </Button>
        )}
      </Box>

      {/* Controls (Search, Filter) */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          boxShadow: "0 2px 6px 0 rgba(67, 89, 113, 0.12)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            placeholder="Cari data..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 200 } }}>
            <InputLabel id="filter-column-label">Filter Berdasarkan</InputLabel>
            <Select
              labelId="filter-column-label"
              value={filterColumn}
              label="Filter Berdasarkan"
              onChange={(e) => {
                setFilterColumn(e.target.value);
                setFilterValue("");
                setPage(0);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                </InputAdornment>
              }
              sx={{
                borderRadius: "10px",
                "& fieldset": { borderColor: "#E0E0E0" },
              }}
            >
              <MenuItem value="">
                <em>Tidak ada</em>
              </MenuItem>
              {effectiveColumns
                .filter((col) => FILTER_WHITELIST.includes(col))
                .map((col) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Filter Value */}
          {filterColumn && (
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", md: 200 } }}
            >
              <InputLabel id="filter-value-label">Pilih Nilai</InputLabel>
              <Select
                labelId="filter-value-label"
                value={filterValue}
                label="Pilih Nilai"
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setPage(0);
                }}
                sx={{
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "#E0E0E0" },
                }}
              >
                <MenuItem value="">
                  <em>Semua</em>
                </MenuItem>
                {getUniqueValues(filterColumn).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {(searchQuery || filterColumn || sortColumn) && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              Reset
            </Button>
          )}
        </Stack>

        {(searchQuery || filterColumn || sortColumn) && (
          <Box mt={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {searchQuery && (
                <Chip
                  label={`Pencarian: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                />
              )}
              {filterColumn && filterValue && (
                <Chip
                  label={`${filterColumn}: ${filterValue}`}
                  size="small"
                  onDelete={() => {
                    setFilterColumn("");
                    setFilterValue("");
                  }}
                />
              )}
              {sortColumn && (
                <Chip
                  label={`Urut: ${sortColumn} (${
                    sortDirection === "asc" ? "A-Z" : "Z-A"
                  })`}
                  size="small"
                  onDelete={() => setSortColumn("")}
                />
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Data Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 2px 6px 0 rgba(67, 89, 113, 0.12)",
        }}
      >
        <Box sx={{ overflowX: "auto", width: "100%" }}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              {/* Row 1: Main Headers + Checkbox */}
              <TableRow>
                <TableCell
                  width={40}
                  rowSpan={2}
                  padding="checkbox"
                  sx={{
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <Checkbox
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < filteredAndSortedData.length
                    }
                    checked={
                      filteredAndSortedData.length > 0 &&
                      selectedIds.length === filteredAndSortedData.length
                    }
                    onChange={handleToggleAll}
                    sx={{ color: "#696CFF" }}
                  />
                </TableCell>
                <TableCell
                  width={50}
                  rowSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 2,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  NO
                </TableCell>
                {effectiveColumns
                  .filter(
                    (col) =>
                      !col.startsWith("RUJUK_") &&
                      !col.startsWith("PTM_") &&
                      !col.startsWith("DIRUJUK_"),
                  )
                  .map((column) => {
                    const isSortable = !NON_SORTABLE_COLUMNS.includes(column);
                    const columnWidth = getColumnWidth(column);
                    const columnAlign = getColumnAlign();

                    return (
                      <TableCell
                        key={column}
                        width={columnWidth}
                        align={columnAlign}
                        rowSpan={2}
                        sx={{
                          fontWeight: 700,
                          color: "black",
                          whiteSpace: "nowrap",
                          py: 2,
                          backgroundColor: "#F1F5F9",
                          minWidth: columnWidth,
                          borderBottom: "1px solid #ddd",
                          fontSize: "12.75px",
                        }}
                      >
                        {isSortable ? (
                          <TableSortLabel
                            active={true}
                            direction={
                              sortColumn === column ? sortDirection : "asc"
                            }
                            onClick={() => handleSort(column)}
                            IconComponent={ArrowDownwardIcon}
                            sx={{
                              color: "black !important",
                              "& .MuiTableSortLabel-icon": {
                                opacity: sortColumn === column ? 1 : 0.3,
                                transition: "opacity 0.2s",
                                color: "black !important",
                              },
                              "&:hover .MuiTableSortLabel-icon": {
                                opacity: 1,
                              },
                              "&.Mui-active": {
                                color: "black",
                              },
                            }}
                          >
                            {column}
                          </TableSortLabel>
                        ) : (
                          column
                        )}
                      </TableCell>
                    );
                  })}
                {/* Rujukan Grouped Headers (Row 1 - Category) */}
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  RUJUK FASKES PERTAMA
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  RUJUK KE FKRTL
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  PTM DIRUJUK KE FKRTL
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  DIRUJUK BALIK DARI PUSKESMAS
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    borderBottom: "1px solid #ddd",
                    fontSize: "12.75px",
                  }}
                >
                  DIRUJUK BALIK DARI FKRTL
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell
                    width={120}
                    align="center"
                    rowSpan={2}
                    sx={{
                      fontWeight: 700,
                      color: "black",
                      py: 2,
                      backgroundColor: "#F1F5F9",
                      borderBottom: "1px solid #ddd",
                      fontSize: "12.75px",
                    }}
                  >
                    AKSI
                  </TableCell>
                )}
              </TableRow>

              {/* Row 2: PB / PL Sub-headers */}
              <TableRow>
                {/* First: Rujuk Faskes Pertama PB/PL */}
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "0.75rem",
                  }}
                >
                  PB
                </TableCell>
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "0.75rem",
                  }}
                >
                  PL
                </TableCell>
                {/* Second: Rujuk FKRTL PB/PL */}
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PB
                </TableCell>
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PL
                </TableCell>
                {/* Third: PTM FKRTL PB/PL */}
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PB
                </TableCell>
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PL
                </TableCell>
                {/* Fourth: Dirujuk Balik Puskesmas PB/PL */}
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PB
                </TableCell>
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PL
                </TableCell>
                {/* Fifth: Dirujuk Balik FKRTL PB/PL */}
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PB
                </TableCell>
                <TableCell
                  align="center"
                  width={70}
                  sx={{
                    fontWeight: 600,
                    color: "black",
                    py: 1,
                    backgroundColor: "#F1F5F9",
                    fontSize: "12.75px",
                  }}
                >
                  PL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      effectiveColumns.length +
                      2 +
                      (canEdit || canDelete ? 1 : 0)
                    }
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <Typography color="text.secondary">
                        Tidak ada data di bulan ini
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = Number((row as any).id) || 0;
                  const isSelected = selectedIds.includes(rowId);
                  return (
                    <TableRow
                      key={rowId || index}
                      hover
                      selected={isSelected}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        backgroundColor: isSelected
                          ? "rgba(105, 108, 255, 0.04) !important"
                          : "inherit",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleRow(rowId)}
                          sx={{ color: "#696CFF" }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          fontSize: "12.75px",
                          fontWeight: 700,
                        }}
                      >
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      {effectiveColumns.map((column) => {
                        let cellValue = getRowValue(row, column) || "-";
                        const columnWidth = getColumnWidth(column);
                        const columnAlign = getColumnAlign();

                        if (column === "TANGGAL" && cellValue !== "-") {
                          cellValue = formatDate(String(cellValue));
                        }

                        // Kolom dengan teks panjang yang perlu word wrap
                        const isLongTextColumn = [
                          "OBS TTV",
                          "KELUHAN",
                          "DIAGNOSIS",
                          "TINDAKAN",
                          "TINDAKAN ",
                          "OBAT",
                          "NAMA",
                        ].includes(column);

                        return (
                          <TableCell
                            key={column}
                            align={columnAlign}
                            sx={{
                              color: "black",
                              py: 1.5,
                              minWidth: columnWidth,
                              maxWidth: columnWidth,
                              whiteSpace: isLongTextColumn
                                ? "normal"
                                : "nowrap",
                              wordWrap: isLongTextColumn
                                ? "break-word"
                                : "normal",
                              overflow: "hidden",
                              fontSize: "12.75px",
                              fontWeight: column === "NAMA" ? 700 : 400,
                            }}
                          >
                            {String(cellValue)}
                          </TableCell>
                        );
                      })}
                      {(canEdit || canDelete) && (
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            {canEdit && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditPatient(row)}
                                  sx={{
                                    color: "#696CFF",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(105, 108, 255, 0.1)",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ width: "100%", mt: 1 }}>
        <TablePagination
          component="div"
          count={filteredAndSortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100, 200, 500]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} dari ${count}`
          }
          sx={{
            width: "100%",
            ".MuiTablePagination-toolbar": {
              px: 1, // Minimize padding
            },
            ".MuiTablePagination-spacer": {
              display: "none", // Hide standard spacer
            },
            ".MuiTablePagination-displayedRows": {
              marginLeft: "auto", // Push displayedRows and actions to the right
            },
          }}
        />
      </Box>

      {/* Floating Action Bar for Bulk Selection */}
      <Fade in={selectedIds.length > 0}>
        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "#232333",
            color: "white",
            py: 1.5,
            px: 3,
            borderRadius: "50px",
            display: "flex",
            alignItems: "center",
            gap: 3,
            zIndex: 1300,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <CheckboxIcon sx={{ color: "#696CFF" }} />
            <Typography variant="body2" fontWeight={700}>
              {selectedIds.length} Data Terpilih
            </Typography>
          </Box>
          <Box
            sx={{
              width: "1px",
              height: "24px",
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setSelectedIds([])}
              sx={{ color: "#8592A3", fontWeight: 700 }}
            >
              Batal
            </Button>
            {canDelete && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteSweepIcon />}
                onClick={handleBulkDelete}
                sx={{
                  borderRadius: "20px",
                  px: 2,
                  fontWeight: 800,
                  boxShadow: "0 4px 12px rgba(255, 76, 81, 0.4)",
                  "&:hover": { backgroundColor: "#e54448" },
                }}
              >
                Hapus Data
              </Button>
            )}
          </Stack>
        </Paper>
      </Fade>

      <PatientFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPatient}
        mode={formMode}
        defaultTahun={nextTahun}
        existingPatients={data} // Pass all data for calculation
        lastL={lastL}
        lastP={lastP}
      />
    </Box>
  );
}

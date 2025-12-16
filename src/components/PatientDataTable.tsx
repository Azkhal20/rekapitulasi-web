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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Patient } from "@/types/patient";
import PatientFormDialog from "./PatientFormDialog";
import { patientService, PatientData } from "@/services/patientService";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Setup SweetAlert2 Toast
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

// Columns that should NOT be sortable
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

interface PatientDataTableProps {
  data: Patient[] | PatientData[]; // Support both types
  onDataChange?: () => void;
  sheetName: string; // REQUIRED: To know which monthly sheet to edit
}

// Type Guard or Helper to access properties safely
function getRowValue(
  row: Patient | PatientData,
  column: string
): string | number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (row as any)[column];
}

export default function PatientDataTable({
  data,
  onDataChange,
  sheetName,
}: PatientDataTableProps) {
  // Existing table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  // CRUD state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(
    null
  );

  const [nextTahun, setNextTahun] = useState<string>("1");

  // Get column names from first data row
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((key) => key !== "id");
  }, [data]);

  // Fallback columns if data is empty (to show headers)
  const effectiveColumns = useMemo(() => {
    if (columns.length > 0) return columns;
    // Default headers order matching the Form/Sheet typically
    return [
      "TANGGAL",
      "HARI",
      "BULAN",
      "TAHUN",
      "16-15",
      "L",
      "P",
      "NAMA",
      "USIA",
      "NIP",
      "OBS TTV",
      "KELUHAN",
      "DIAGNOSIS",
      "ICD-10",
      "TINDAKAN",
      "OBAT",
    ];
  }, [columns]);

  // Helper to format date
  // FIX INVALID DATE ISSUE
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "-";
      // If it already looks like "16 Des 2025" (contains letters), just return it
      // Simple regex to check for alphabetical characters
      if (/[a-zA-Z]/.test(dateString)) return dateString;

      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString; // Return original if parsing fails

      // Format: 15 Nov 2025
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get unique values for a column (for filter dropdown)
  const getUniqueValues = (column: string) => {
    const values = data
      .map((row) => String(getRowValue(row, column) || ""))
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      result = result.filter(
        (row) => String(getRowValue(row, filterColumn)) === filterValue
      );
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = String(getRowValue(a, sortColumn) || "");
        const bValue = String(getRowValue(b, sortColumn) || "");

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return result;
  }, [data, searchQuery, filterColumn, filterValue, sortColumn, sortDirection]);

  // Paginate data
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
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // CRUD Handlers
  const handleAddPatient = () => {
    // LOGIC: Get Last Row's TAHUN + 1
    let nextNum = "1";
    if (data.length > 0) {
      // Sort by ID descending to get the latest entry added
      // Fix: Type safe access to id
      const sorted = [...data].sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idA = Number((a as any).id) || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idB = Number((b as any).id) || 0;
        return idB - idA;
      });
      const lastEntry = sorted[0];

      // Fix: Safe access to TAHUN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastTahun = (lastEntry as any).TAHUN;

      if (lastEntry && lastTahun) {
        // Try parsing previous TAHUN value
        // FIX: parseInt expects string, so we convert explicitly
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

  const handleEditPatient = (patient: Patient | PatientData) => {
    setNextTahun("");
    setFormMode("edit");

    // Helper access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = patient as any;

    // MAPPING FIX: Sesuaikan dengan Key dari Google Sheet JSON
    const patientData: PatientData = {
      id: p.id as number,
      TANGGAL: String(p.TANGGAL || ""),
      TAHUN: String(p.TAHUN || ""),
      BULAN: String(p.BULAN || ""),
      HARI: String(p.HARI || ""),
      ENAM_BELAS_LIMA_BELAS: String(
        p["16-15"] || p.ENAM_BELAS_LIMA_BELAS || ""
      ),
      L: String(p.L || ""),
      P: String(p.P || ""),
      NAMA: String(p.NAMA || ""),
      USIA: String(p.USIA || ""),
      NIP: String(p.NIP || ""),
      OBS_TTV: String(p["OBS TTV"] || p.OBS_TTV || ""),
      KELUHAN: String(p.KELUHAN || ""),
      DIAGNOSIS: String(p.DIAGNOSIS || ""),
      // Robust key mapping for ICD-10 and TINDAKAN
      ICD10: String(p["ICD-10"] || p["ICD 10"] || p.ICD10 || ""),
      TINDAKAN: String(p["TINDAKAN"] || p["TINDAKAN "] || p.TINDAKAN || ""),
      OBAT: String(p.OBAT || ""),
    };

    setSelectedPatient(patientData);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (patient: Patient | PatientData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = patient as any;

    MySwal.fire({
      title: "Apakah Anda yakin?",
      text: `Anda akan menghapus data pasien ${p.NAMA}. Data tidak dapat dikembalikan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF4C51",
      cancelButtonColor: "#8592A3",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          MySwal.fire({
            title: "Menghapus...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // PASS SHEET NAME TO SERVICE
          await patientService.deletePatient(p.id as number, sheetName);

          Swal.close();

          setTimeout(() => {
            Toast.fire({
              icon: "success",
              title: "Data pasien berhasil dihapus",
            });
          }, 300);

          if (onDataChange) {
            onDataChange();
          }
        } catch (error) {
          console.error("Error deleting patient:", error);
          Swal.close();
          setTimeout(() => {
            Toast.fire({
              icon: "error",
              title: "Gagal menghapus data pasien",
            });
          }, 300);
        }
      }
    });
  };

  const handleFormSubmit = async (formData: Omit<PatientData, "id">) => {
    try {
      MySwal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // MAPPING FIX FOR WRITE OPERATIONS
      // Google Sheets backend V5 expects Header names as keys (e.g., "OBS TTV", not "OBS_TTV")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...formData };

      // Remap internal keys to Google Sheet keys
      if (payload.OBS_TTV) {
        payload["OBS TTV"] = payload.OBS_TTV;
        delete payload.OBS_TTV;
      }
      if (payload.ICD10) {
        payload["ICD-10"] = payload.ICD10;
        delete payload.ICD10;
      }
      if (payload.ENAM_BELAS_LIMA_BELAS) {
        payload["16-15"] = payload.ENAM_BELAS_LIMA_BELAS;
        delete payload.ENAM_BELAS_LIMA_BELAS;
      }

      // Let's force-add these keys to payload just in case
      payload["OBS TTV"] = formData.OBS_TTV || "";
      payload["ICD-10"] = formData.ICD10 || "";
      payload["16-15"] = formData.ENAM_BELAS_LIMA_BELAS || "";
      payload["TINDAKAN"] = formData.TINDAKAN || "";
      payload["TINDAKAN "] = formData.TINDAKAN || "";

      if (formMode === "add") {
        // PASS SHEET NAME TO SERVICE
        await patientService.addPatient(payload, sheetName);

        Swal.close();
        setTimeout(() => {
          Toast.fire({
            icon: "success",
            title: "Data pasien berhasil ditambahkan",
          });
        }, 300);
      } else {
        if (selectedPatient?.id) {
          // PASS SHEET NAME TO SERVICE
          await patientService.updatePatient(
            selectedPatient.id,
            payload,
            sheetName
          );

          Swal.close();
          setTimeout(() => {
            Toast.fire({
              icon: "success",
              title: "Data pasien berhasil diperbarui",
            });
          }, 300);
        }
      }

      setFormDialogOpen(false);
      setSelectedPatient(null);

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      Swal.close();
      setTimeout(() => {
        Toast.fire({
          icon: "error",
          title: `Gagal ${
            formMode === "add" ? "menambahkan" : "memperbarui"
          } data pasien`,
        });
      }, 300);
      throw error;
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
        }}
      >
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
            <InputLabel>Filter Kolom</InputLabel>
            <Select
              value={filterColumn}
              label="Filter Kolom"
              onChange={(e) => {
                setFilterColumn(e.target.value);
                setFilterValue("");
                setPage(0);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <strong>Tidak ada</strong>
              </MenuItem>
              {effectiveColumns.map((col) => (
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
              <InputLabel>Nilai Filter</InputLabel>
              <Select
                value={filterValue}
                label="Nilai Filter"
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <strong>Semua</strong>
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
              <TableRow>
                <TableCell
                  width={50}
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 2,
                    backgroundColor: "#F8FAFB", // Updated Color
                  }}
                >
                  NO
                </TableCell>
                {effectiveColumns.map((column) => {
                  // Check if sorting feature should be disabled for this column
                  const isSortable = !NON_SORTABLE_COLUMNS.includes(column);

                  return (
                    <TableCell
                      key={column}
                      sx={{
                        fontWeight: 700,
                        color: "black",
                        whiteSpace: "nowrap",
                        py: 2,
                        backgroundColor: "#F8FAFB", // Updated Color
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
                <TableCell
                  width={120}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    color: "black",
                    py: 2,
                    backgroundColor: "#F8FAFB", // Updated Color
                  }}
                >
                  AKSI
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={effectiveColumns.length + 2}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <Typography color="text.secondary">
                        Tidak ada data yang sesuai
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={String(getRowValue(row, "id")) || index}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell sx={{ color: "black" }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    {effectiveColumns.map((column) => {
                      // Handle formatting
                      let cellValue = getRowValue(row, column) || "-";

                      // Format Date for 'TANGGAL' column
                      if (column === "TANGGAL" && cellValue !== "-") {
                        cellValue = formatDate(String(cellValue));
                      }

                      return (
                        <TableCell
                          key={column}
                          sx={{ color: "black", py: 1.5 }}
                        >
                          {String(cellValue)}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPatient(row)}
                            sx={{
                              color: "#696CFF",
                              "&:hover": {
                                backgroundColor: "rgba(105, 108, 255, 0.1)",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(row)}
                            sx={{
                              color: "#FF4C51",
                              "&:hover": {
                                backgroundColor: "rgba(255, 76, 81, 0.1)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
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
          rowsPerPageOptions={[5, 10, 25, 50]}
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

      <PatientFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPatient}
        mode={formMode}
        defaultTahun={nextTahun}
      />
    </Box>
  );
}

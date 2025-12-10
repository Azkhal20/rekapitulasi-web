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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Patient } from "@/types/patient";

interface PatientDataTableProps {
  data: Patient[];
}

export default function PatientDataTable({ data }: PatientDataTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  // Get column names from first data row
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((key) => key !== "id");
  }, [data]);

  // Get unique values for a column (for filter dropdown)
  const getUniqueValues = (column: string) => {
    const values = data.map((row) => String(row[column] || "")).filter(Boolean);
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
        (row) => String(row[filterColumn]) === filterValue
      );
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = String(a[sortColumn] || "");
        const bValue = String(b[sortColumn] || "");

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

  if (columns.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Box>Tidak ada data untuk ditampilkan</Box>
      </Paper>
    );
  }

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
          ADD DATA
        </Button>
      </Box>

      {/* Search and Filter Controls */}
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
          {/* Search */}
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

          {/* Filter Column */}
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
              {columns.map((col) => (
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

          {/* Clear Filters Button */}
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

        {/* Active Filters Display */}
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
              <TableRow sx={{ backgroundColor: "#eeeeee" }}>
                <TableCell
                  width={50}
                  sx={{ fontWeight: 700, color: "black", py: 2 }}
                >
                  NO
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      fontWeight: 700,
                      color: "black",
                      whiteSpace: "nowrap",
                      py: 2,
                    }}
                  >
                    <TableSortLabel
                      active={true}
                      direction={sortColumn === column ? sortDirection : "asc"}
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
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
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
                    key={row.id || index}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell sx={{ color: "black" }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} sx={{ color: "black", py: 1.5 }}>
                        {String(row[column] || "-")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>

      {/* Pagination */}
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
      />
    </Box>
  );
}

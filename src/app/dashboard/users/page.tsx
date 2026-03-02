"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Visibility as ViewerIcon,
  Engineering as OperatorIcon,
} from "@mui/icons-material";
import { usePermissions } from "@/hooks/usePermissions";
import { userService, User } from "@/services/userService";
import UserDialog from "@/components/UserDialog";
import Swal from "sweetalert2";

export default function UsersManagementPage() {
  const { isSuperAdmin } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    } else {
      setLoading(false); // Stop loading if not super admin, access denied will show
    }
  }, [isSuperAdmin]);

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    const result = await Swal.fire({
      title: "Hapus User?",
      text: `Anda akan menghapus user "${user.username}". Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Menghapus...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        if (user.id) {
          await userService.deleteUser(user.id);
          await fetchUsers(); // Refresh list
          Swal.fire("Terhapus!", "User berhasil dihapus.", "success");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus user.", "error");
      }
    }
  };

  const handleSaveUser = async (userData: User) => {
    setSaving(true);
    try {
      // If editing, merge ID
      if (editingUser?.id) {
        userData.id = editingUser.id;
        // Don't change username in edit mode
        userData.username = editingUser.username;
      }

      const response = await userService.saveUser(userData);

      if (response.success) {
        setDialogOpen(false);
        await fetchUsers();
        Swal.fire({
          icon: "success",
          title: editingUser ? "Berhasil Diupdate" : "Berhasil Dibuat",
          text: response.message,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.message || "Gagal menyimpan user");
      }
    } catch (error: any) {
      console.error(error);
      Swal.fire("Error", error.message || "Terjadi kesalahan sistem", "error");
    } finally {
      setSaving(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
    let color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning" = "default";
    let icon = <PersonIcon fontSize="small" />;

    switch (role) {
      case "super_admin":
        color = "error";
        icon = <SecurityIcon fontSize="small" />;
        break;
      case "admin":
        color = "primary";
        icon = <PersonIcon fontSize="small" />;
        break;
      case "operator":
        color = "warning";
        icon = <OperatorIcon fontSize="small" />;
        break;
      case "viewer":
        color = "info";
        icon = <ViewerIcon fontSize="small" />;
        break;
    }

    return (
      <Chip
        icon={icon}
        label={role.replace("_", " ").toUpperCase()}
        color={color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: "bold" }}
      />
    );
  };

  // Restricted Access View
  if (!isSuperAdmin && !loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <Paper elevation={3} sx={{ p: 5, borderRadius: 3 }}>
          <SecurityIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom fontWeight="bold">
            Akses Ditolak
          </Typography>
          <Typography color="text.secondary">
            Halaman ini hanya dapat diakses oleh Super Admin.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(45deg, #1e88e5 30%, #5e35b1 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Manajemen Pengguna
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Kelola akses dan akun pengguna aplikasi
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          sx={{
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            padding: "8px 24px",
          }}
        >
          Tambah User
        </Button>
      </Box>

      {/* Content */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          mb: 2,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
              <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", width: "50px" }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Nama Lengkap
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Belum ada data user.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {row.username}
                      </TableCell>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{getRoleBadge(row.role)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleEditUser(row)}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton
                            onClick={() => handleDeleteUser(row)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog */}
      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSaveUser}
        initialData={editingUser}
        loading={saving}
      />
    </Container>
  );
}

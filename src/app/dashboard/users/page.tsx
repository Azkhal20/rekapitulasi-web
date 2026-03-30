"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { userService, User } from "@/services/userService";
import UserDialog from "@/components/UserDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { isSuperAdmin, role } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    // Basic protection (though middleware should handle this)
    if (role && role !== "super_admin") {
      router.push("/dashboard");
    }
    fetchUsers();
  }, [role, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setDialogOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (user.username === "super_admin") {
      alert("Jangan hapus root super_admin!");
      return;
    }
    if (confirm(`Hapus pengguna ${user.username}?`)) {
      try {
        await userService.deleteUser(user.id!);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus pengguna.");
      }
    }
  };

  const handleSave = async (userData: User) => {
    try {
      if (editUser) {
        await userService.updateUser(userData);
      } else {
        await userService.addUser(userData);
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data pengguna.");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "error";
      case "admin":
        return "primary";
      case "operator":
        return "success";
      default:
        return "default";
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#566a7f">
            Manajemen Pengguna
          </Typography>
          <Typography variant="body2" color="#a1acb8">
            Kelola akses dan akun karyawan Poli Klinik
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            backgroundColor: "#696CFF",
            "&:hover": { backgroundColor: "#5F61E6" },
            boxShadow: "0 2px 4px 0 rgba(105, 108, 255, 0.4)",
          }}
        >
          Tambah Pengguna
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 2px 6px 0 rgba(67, 89, 113, 0.12)",
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "#F5F5F9" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nama Lengkap</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                Aksi
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.username} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {user.username}
                  </TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.toUpperCase()}
                      size="small"
                      color={getRoleColor(user.role) as any}
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(user)}
                      size="small"
                      sx={{ color: "#696CFF" }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user)}
                      size="small"
                      sx={{ color: "#FF3E1D" }}
                      disabled={user.username === "super_admin"}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 3, color: "#a1acb8" }}
                >
                  Tidak ada data pengguna ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        editUser={editUser}
      />
    </Box>
  );
}

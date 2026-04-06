"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import { useState, useEffect } from "react";
import { User } from "@/services/userService";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  editUser?: User | null;
}

export default function UserDialog({
  open,
  onClose,
  onSave,
  editUser,
}: UserDialogProps) {
  const [formData, setFormData] = useState<User>({
    username: "",
    password: "",
    role: "admin",
    fullName: "",
  });

  useEffect(() => {
    if (editUser) {
      setFormData({
        ...editUser,
        password: "",
      });
    } else {
      setFormData({
        username: "",
        password: "",
        role: "admin",
        fullName: "",
      });
    }
  }, [editUser, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {editUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Username"
            fullWidth
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            disabled={!!editUser}
          />
          {!editUser && (
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          )}
          {editUser && (
            <TextField
              label="Password Baru (Kosongkan jika tidak ganti)"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          )}
          <TextField
            label="Nama Lengkap"
            fullWidth
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as User["role"],
                })
              }
            >
              <MenuItem value="super_admin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin / Operator</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.username || (!editUser && !formData.password)}
        >
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

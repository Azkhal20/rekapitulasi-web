import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { type User } from "@/services/userService";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (user: User) => Promise<void>;
  initialData: User | null;
  loading: boolean;
}

export default function UserDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: UserDialogProps) {
  const [formData, setFormData] = useState<User>({
    username: "",
    password: "",
    role: "viewer", // Default safe role
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          password: "", // Don't show existing password hash, leave empty for 'unchanged'
        });
      } else {
        setFormData({
          username: "",
          password: "",
          role: "viewer",
          fullName: "",
        });
      }
      setShowPassword(false);
    }
  }, [open, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 1,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          {isEditMode ? "Edit User" : "Tambah User Baru"}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              required
              disabled={isEditMode} // Usually forbid changing username for simplicity unless requested
              helperText={isEditMode ? "Username tidak dapat diubah" : ""}
            />

            <TextField
              label="Nama Lengkap"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Role Access</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={(e) => handleChange(e as any)} // Select event type casting
                label="Role Access"
              >
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="operator">Operator</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={
                isEditMode
                  ? "Password Baru (Kosongkan jika tidak ubah)"
                  : "Password"
              }
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!isEditMode} // Required only for new user
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {!isEditMode && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              * Username harus unik.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              backgroundImage: "linear-gradient(to right, #6366F1, #8B5CF6)", // Gradient as per theme suggestion
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {loading
              ? "Menyimpan..."
              : isEditMode
                ? "Simpan Perubahan"
                : "Buat User"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

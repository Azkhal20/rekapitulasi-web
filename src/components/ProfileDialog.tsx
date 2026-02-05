import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { formatRole, UserData } from "@/lib/auth";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserData;
}

export default function ProfileDialog({
  open,
  onClose,
  userData,
}: ProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password Update State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Edit Profile State
  const [editFullName, setEditFullName] = useState(userData.fullName);
  const [editUsername, setEditUsername] = useState(userData.username);

  // Sync state with userData when it changes or dialog opens
  useEffect(() => {
    if (open) {
      setEditFullName(userData.fullName);
      setEditUsername(userData.username);
      setError("");
      setSuccess("");
      setActiveTab("info");
    }
  }, [open, userData]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (activeTab === "password") {
        if (!oldPassword || !newPassword || !confirmPassword) {
          throw new Error("Semua field password wajib diisi");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok");
        }
        if (newPassword.length < 6) {
          throw new Error("Password baru minimal 6 karakter");
        }
      }

      // Payload Construction
      interface PayloadType {
        username: string;
        action: string;
        fullName?: string;
        newUsername?: string;
        oldPassword?: string;
        newPassword?: string;
      }

      const payload: PayloadType = {
        username: userData.username, // Username lama untuk identifikasi
        action: activeTab === "password" ? "updatePassword" : "updateProfile",
      };

      if (activeTab === "info") {
        if (!editUsername || !editFullName) {
          throw new Error("Username dan Nama Lengkap wajib diisi");
        }
        payload.fullName = editFullName;
        // Kirim newUsername hanya jika berbeda dengan yang lama
        if (editUsername !== userData.username) {
          payload.newUsername = editUsername;
        }
      } else {
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM}?action=${payload.action}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(
          "Berhasil diperbarui! Silakan login ulang untuk melihat perubahan.",
        );
        if (activeTab === "password") {
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      } else {
        throw new Error(result.message || "Gagal memperbarui profil");
      }
    } catch (err: unknown) {
      let errorMessage = "Terjadi kesalahan";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          backgroundImage: "linear-gradient(to bottom right, #ffffff, #f8f9fa)",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Profil Saya
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ p: 0 }}>
        {/* TABS */}
        <Box sx={{ px: 3, pt: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              mb: 3,
              p: 0.5,
              bgcolor: "#f5f5f9",
              borderRadius: 3,
            }}
          >
            <Button
              fullWidth
              variant={activeTab === "info" ? "contained" : "text"}
              onClick={() => setActiveTab("info")}
              sx={{
                borderRadius: 2.5,
                boxShadow: activeTab === "info" ? 2 : 0,
                bgcolor: activeTab === "info" ? "white" : "transparent",
                color: activeTab === "info" ? "primary.main" : "text.secondary",
                "&:hover": {
                  bgcolor: activeTab === "info" ? "white" : "rgba(0,0,0,0.04)",
                },
              }}
              startIcon={<PersonIcon />}
            >
              Info Pribadi
            </Button>
            <Button
              fullWidth
              variant={activeTab === "password" ? "contained" : "text"}
              onClick={() => setActiveTab("password")}
              sx={{
                borderRadius: 2.5,
                boxShadow: activeTab === "password" ? 2 : 0,
                bgcolor: activeTab === "password" ? "white" : "transparent",
                color:
                  activeTab === "password" ? "primary.main" : "text.secondary",
                "&:hover": {
                  bgcolor:
                    activeTab === "password" ? "white" : "rgba(0,0,0,0.04)",
                },
              }}
              startIcon={<VpnKeyIcon />}
            >
              Ganti Password
            </Button>
          </Box>

          {/* ALERTS */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {/* TAB: INFO */}
          {activeTab === "info" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
                helperText="Anda dapat mengubah username."
              />

              <TextField
                fullWidth
                label="Nama Lengkap"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
                helperText="Nama lengkap Anda."
              />

              <TextField
                fullWidth
                label="Role"
                value={formatRole(userData.role)}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
                helperText="Role tidak dapat diubah."
              />
            </Box>
          )}

          {/* TAB: PASSWORD */}
          {activeTab === "password" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Password Lama"
                type={showPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password Baru"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
                helperText="Minimal 6 karakter"
              />

              <TextField
                fullWidth
                label="Konfirmasi Password Baru"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ "& .MuiInputBase-root": { borderRadius: 3 } }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            color: "text.primary",
            fontWeight: 600,
            px: 3,
          }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdateProfile}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
            boxShadow: 4,
            fontWeight: 600,
            background: "linear-gradient(135deg, #696cff 0%, #8592ff 100%)",
          }}
          startIcon={
            loading ? <CircularProgress size={20} color="primary" /> : null
          }
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

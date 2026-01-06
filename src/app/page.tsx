"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import { useRouter } from "next/navigation";

type TabType = "login" | "register";

interface ValidationErrors {
  username?: string;
  password?: string;
  fullName?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regRole, setRegRole] = useState("admin");

  // Validation State
  const [loginErrors, setLoginErrors] = useState<ValidationErrors>({});
  const [regErrors, setRegErrors] = useState<ValidationErrors>({});

  // UI State
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    // Import dynamically to avoid SSR issues
    import("@/lib/auth").then(({ isAuthenticated }) => {
      if (isAuthenticated()) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  // Validation Functions
  const validateLogin = (): boolean => {
    const errors: ValidationErrors = {};

    if (!loginUsername.trim()) {
      errors.username = "Username wajib diisi";
    }

    if (!loginPassword) {
      errors.password = "Password wajib diisi";
    } else if (loginPassword.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: ValidationErrors = {};

    if (!regUsername.trim()) {
      errors.username = "Username wajib diisi";
    } else if (regUsername.length < 4) {
      errors.username = "Username minimal 4 karakter";
    } else if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) {
      errors.username = "Username hanya boleh huruf, angka, dan underscore";
    }

    if (!regFullName.trim()) {
      errors.fullName = "Nama lengkap wajib diisi";
    } else if (regFullName.length < 3) {
      errors.fullName = "Nama minimal 3 karakter";
    }

    if (!regPassword) {
      errors.password = "Password wajib diisi";
    } else if (regPassword.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM}?action=login`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            username: loginUsername,
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Import auth utility
        const { saveUserSession } = await import("@/lib/auth");

        // Save session with proper structure
        saveUserSession({
          username: data.user.USERNAME,
          role: data.user.ROLE,
          fullName: data.user.NAMA_LENGKAP,
        });

        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setError(data.message || "Username atau password salah");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server. Cek koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM}?action=register`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            username: regUsername,
            password: regPassword,
            role: regRole,
            fullName: regFullName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError("");
        // Reset form
        setRegUsername("");
        setRegPassword("");
        setRegFullName("");
        setRegRole("admin");
        setRegErrors({});

        // Pindah ke tab login setelah 2 detik
        setTimeout(() => {
          setActiveTab("login");
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.message || "Gagal mendaftar");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Gagal terhubung ke server. Cek koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Title */}
          <div className="text-center mb-8">
            {/* Logo removed as requested */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Rekapitulasi
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              {activeTab === "login"
                ? "Selamat datang kembali!"
                : "Buat akun baru"}
            </p>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => {
                setActiveTab("login");
                setLoginErrors({});
                setError("");
              }}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setRegErrors({});
                setError("");
              }}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all duration-300 ${
                activeTab === "register"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {activeTab === "login"
                ? "Login berhasil! Mengalihkan..."
                : "Registrasi berhasil! Silakan login."}
            </Alert>
          )}

          {/* LOGIN FORM */}
          {activeTab === "login" && (
            <div className="space-y-5">
              <div>
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="Masukkan username"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    setLoginErrors({ ...loginErrors, username: undefined });
                  }}
                  disabled={loading}
                  error={!!loginErrors.username}
                  helperText={loginErrors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginErrors({ ...loginErrors, password: undefined });
                  }}
                  disabled={loading}
                  error={!!loginErrors.password}
                  helperText={loginErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOff className="text-gray-400" />
                          ) : (
                            <Visibility className="text-gray-400" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                      },
                    },
                  }}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          )}

          {/* REGISTER FORM */}
          {activeTab === "register" && (
            <div className="space-y-5">
              <div>
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="Pilih username unik"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    setRegErrors({ ...regErrors, username: undefined });
                  }}
                  disabled={loading}
                  error={!!regErrors.username}
                  helperText={regErrors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <TextField
                  fullWidth
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  value={regFullName}
                  onChange={(e) => {
                    setRegFullName(e.target.value);
                    setRegErrors({ ...regErrors, fullName: undefined });
                  }}
                  disabled={loading}
                  error={!!regErrors.fullName}
                  helperText={regErrors.fullName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password (min. 6 karakter)"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setRegErrors({ ...regErrors, password: undefined });
                  }}
                  disabled={loading}
                  error={!!regErrors.password}
                  helperText={regErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOff className="text-gray-400" />
                          ) : (
                            <Visibility className="text-gray-400" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <div className="relative">
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 pl-12 bg-white/80 hover:bg-white/95 focus:bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-70"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin / Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <BadgeIcon className="text-gray-400" />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <FormHelperText sx={{ ml: 2 }}>
                  Pilih role sesuai tanggung jawab
                </FormHelperText>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Daftar"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © 2026 Rekapitulasi Web. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

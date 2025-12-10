"use client";
import React, { useState } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import AppleIcon from "@mui/icons-material/Apple";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AuthPattern from "../components/AuthPattern";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (email === "admin@example.com" && password === "admin123") {
      localStorage.setItem(
        "user",
        JSON.stringify({ email: email, password: password })
      );
      setSuccess(true);
      setError("");
    } else {
      setError("Email atau password salah");
      setSuccess(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT SECTION */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <h1 className="text-center text-4xl font-bold">Welcome!</h1>
          <p className=" text-center text-gray-600 mt-2">
            We Are Happy To See You Again
          </p>

          {/* Input Form */}
          <div className="mt-10">
            <div className="flex flex-col gap-6">
              {/* Input Email */}
              <TextField
                fullWidth
                label="Email"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full mb-1"
              />
              {/* Input Password */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-full mb-1"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff className="text-gray-400" /> : <Visibility className="text-gray-400" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <p className="text-red-500 text-xs -mt-3 ml-1">{error}</p>
              )}
            </div>

            <div className="flex items-center mt-1 mb-2">
              <Checkbox />
              <span className="text-gray-700 text-sm">Remember me</span>
            </div>


            {/* LOGIN BUTTON */}
            {!success ? (
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-full text-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                Login
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="block w-full text-center py-3.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full text-sm transition-all shadow-lg"
              >
                Login Success
              </Link>
            )
          }

            {/* DIVIDER */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="mx-3 text-gray-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* LOGIN WITH APPLE */}
            <button className="w-full flex justify-center items-center gap-2 mb-3 py-4 bg-black text-white rounded-full text-sm hover:bg-opacity-70">
              <AppleIcon /> Log in with Apple
            </button>

            {/* LOGIN WITH GOOGLE */}
            <button className="w-full flex justify-center items-center gap-2 py-4 border text-black rounded-full text-sm hover:bg-opacity-50 bg-white">
              <GoogleIcon /> Log in with Google
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PATTERN */}
      <div className="hidden lg:flex flex-1 relative w-1/2 overflow-hidden">
        <AuthPattern />
      </div>
    </div>
  );
}
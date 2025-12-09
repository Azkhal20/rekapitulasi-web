"use client";

import Drawer from "./Drawer";
import Header from "./Header";
import { Box, Toolbar } from "@mui/material";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex" }}>
      <Header />
      <Drawer />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Offset supaya tidak ketutup appbar */}
        {children   }
      </Box>
    </Box>
  );
}

"use client";

import { useState } from "react";
import Drawer from "./Drawer";
import Header from "./Header";
import { Box, Toolbar } from "@mui/material";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        open={open}
        handleDrawerToggle={handleDrawerToggle}
        drawerWidth={260}
      />
      <Drawer open={open} drawerWidth={260} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? 260 : 73}px)` },
          transition: (theme) =>
            theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar /> {/* Offset for AppBar */}
        {children}
      </Box>
    </Box>
  );
}

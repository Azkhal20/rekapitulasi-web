"use client";

import { AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

interface HeaderProps {
  open: boolean;
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

export default function Header({
  open,
  handleDrawerToggle,
  drawerWidth,
}: HeaderProps) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        color: "#111827",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
        width: { sm: `calc(100% - ${open ? drawerWidth : 73}px)` },
        ml: { sm: `${open ? drawerWidth : 73}px` },
        transition: (theme) =>
          theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 500 }}
        >
          Dashboard Rekapitulasi Pasien
        </Typography>

        {/* User Profile Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, lineHeight: 1.3, color: "#566a7f" }}
            >
              Super Admin
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#a1acb8", display: "block", fontSize: "0.75rem" }}
            >
              superadmin@example.com
            </Typography>
          </Box>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: "#e7e7ff", // Light purple/gray per reference
              color: "#696cff", // Primary icon color
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 1px #ffffff, 0 0 0 3px #e7e7ff", // Multi-ring effect
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: "1.2rem",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              A
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

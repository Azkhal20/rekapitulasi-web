"use client";

import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useRouter } from "next/navigation";
import {
  getUserSession,
  clearUserSession,
  getUserInitial,
  formatRole,
  UserData,
} from "@/lib/auth";
import ProfileDialog from "../ProfileDialog";

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
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // State for Profile Dialog
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // User Data State
  const [userInfo, setUserInfo] = useState<UserData>({
    username: "",
    fullName: "User",
    role: "admin",
    loginTime: 0,
  });

  // Derived state for initial (just for display convenience)
  const initial = getUserInitial(userInfo.fullName);

  useEffect(() => {
    const loadUser = () => {
      const userData = getUserSession();
      if (userData) {
        setUserInfo({
          username: userData.username,
          fullName: userData.fullName || "User",
          role: userData.role || "admin",
          loginTime: userData.loginTime || 0,
        });
      }
    };
    loadUser();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    clearUserSession();
    handleMenuClose();
    router.replace("/");
  };

  return (
    <>
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
            sx={{ flexGrow: 1, fontWeight: 600 }}
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
                {formatRole(userInfo.role)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#a1acb8", display: "block", fontSize: "0.75rem" }}
              >
                {userInfo.fullName}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                "&:hover": {
                  transform: "scale(1.05)",
                  transition: "transform 0.2s",
                },
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  bgcolor: "#e7e7ff",
                  color: "#696cff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 1px #ffffff, 0 0 0 3px #e7e7ff",
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
                  {initial}
                </Box>
              </Box>
            </IconButton>
          </Box>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {userInfo.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRole(userInfo.role)}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfileOpen} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profil</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: "error.main",
                "&:hover": {
                  bgcolor: "error.lighter",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Profile Dialog */}
      <ProfileDialog
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userData={userInfo}
      />
    </>
  );
}

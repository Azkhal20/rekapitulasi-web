"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CSSObject,
  Theme,
  styled,
  Typography,
  Collapse,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Box,
  Divider,
  Paper,
  ListItemButton as MuiListItemButton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useState, useEffect } from "react";

const openedMixin = (theme: Theme, drawerWidth: number): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 2.5),
  justifyContent: "flex-start",
  minHeight: 80,
}));

const StyledDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerWidth",
})<{ open?: boolean; drawerWidth: number }>(({ theme, open, drawerWidth }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme, drawerWidth),
    "& .MuiDrawer-paper": openedMixin(theme, drawerWidth),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const menuItems = [
  {
    header: "BERANDA",
    items: [
      {
        text: "Dashboard",
        icon: <DashboardIcon />,
        href: "/dashboard",
      },
      {
        text: "Data Pasien",
        icon: <LocalHospitalIcon />,
        children: [
          {
            text: "Poli Umum",
            icon: <PeopleIcon />,
            href: "/dashboard/poli/umum",
          },
          {
            text: "Poli Gigi",
            icon: <MedicalServicesIcon />,
            href: "/dashboard/poli/gigi",
          },
        ],
      },
      {
        text: "Laporan Periodik",
        icon: <SummarizeIcon />,
        href: "/dashboard/reports",
      },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  drawerWidth: number;
}

export default function Sidebar({ open, drawerWidth }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Data Pasien": true,
  });

  const handleGroupClick = (text: string) => {
    setOpenGroups((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <StyledDrawer variant="permanent" open={open} drawerWidth={drawerWidth}>
      {/* ... (kode DrawerHeader tidak berubah) */}
      <DrawerHeader>
        <LocalHospitalIcon
          sx={{ color: "#696CFF", fontSize: 36, mr: 1.5, flexShrink: 0 }}
        />
        {open && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#566a7f",
                fontSize: "1.25rem",
                fontFamily: "inherit",
              }}
            >
              REKAP <span style={{ color: "#696CFF" }}>APP</span>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#a1acb8",
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              REKAPITULASI PASIEN
            </Typography>
          </Box>
        )}
      </DrawerHeader>

      <List sx={{ px: 1.5 }}>
        {menuItems.map((section, idx) => (
          <Box key={idx}>
            {open && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  mt: 2,
                  mb: 1,
                  display: "block",
                  fontWeight: 700,
                  color: "#a1acb8",
                  opacity: 0.8,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                }}
              >
                {section.header}
              </Typography>
            )}
            {section.items.map((item) => {
              // Menu dengan dropdown
              if (item.children) {
                const isOpen = openGroups[item.text];
                const isChildActive = item.children.some(
                  (child) => pathname === child.href,
                );

                return (
                  <Box key={item.text}>
                    <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleGroupClick(item.text)}
                        sx={{
                          minHeight: 44,
                          justifyContent: open ? "initial" : "center",
                          px: 2.5,
                          borderRadius: 2,
                          color: isChildActive
                            ? "primary.main"
                            : "text.primary",
                          backgroundColor:
                            isChildActive && !isOpen
                              ? "rgba(105, 108, 255, 0.08)"
                              : "transparent",
                          "&:hover": {
                            backgroundColor: "rgba(69, 75, 87, 0.04)",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 2 : "auto",
                            justifyContent: "center",
                            color: isChildActive ? "inherit" : "#566a7f",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.9375rem",
                            fontWeight: isChildActive ? 600 : 400,
                          }}
                          sx={{ opacity: open ? 1 : 0 }}
                        />
                        {open && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                      </ListItemButton>
                    </ListItem>

                    <Collapse in={isOpen && open} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <ListItemButton
                              key={child.text}
                              component={Link}
                              href={child.href}
                              sx={{
                                minHeight: 40,
                                pl: open ? 4 : 2.5,
                                justifyContent: open ? "initial" : "center",
                                borderRadius: 2,
                                mb: 0.5,
                                color: isActive
                                  ? "primary.main"
                                  : "text.secondary",
                                backgroundColor: isActive
                                  ? "rgba(105, 108, 255, 0.16) !important"
                                  : "transparent",
                                "&:hover": {
                                  backgroundColor: "rgba(69, 75, 87, 0.04)",
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 0,
                                  mr: open ? 2 : "auto",
                                  justifyContent: "center",
                                  color: isActive ? "inherit" : "#566a7f",
                                  display: open ? "flex" : "none",
                                }}
                              >
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.text}
                                primaryTypographyProps={{
                                  fontSize: "0.85rem",
                                  fontWeight: isActive ? 600 : 400,
                                }}
                                sx={{ opacity: open ? 1 : 0 }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                );
              }

              // Menu link biasa
              const isActive = pathname === item.href;
              return (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{ display: "block", mb: 0.5 }}
                >
                  <ListItemButton
                    component={Link}
                    href={item.href || "#"}
                    selected={isActive}
                    sx={{
                      minHeight: 44,
                      justifyContent: open ? "initial" : "center",
                      px: 2.5,
                      borderRadius: 2,
                      color: isActive ? "primary.main" : "text.primary",
                      backgroundColor: isActive
                        ? "rgba(105, 108, 255, 0.16) !important"
                        : "transparent",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "rgba(69, 75, 87, 0.04)",
                        color: isActive ? "primary.main" : "#435971",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : "auto",
                        justifyContent: "center",
                        color: isActive ? "inherit" : "#566a7f",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.9375rem",
                        fontWeight: isActive ? 600 : 400,
                      }}
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        ))}
      </List>

      {/* Sidebar Footer or Spacer if needed */}
      <Box sx={{ mt: "auto", pb: 2 }} />
    </StyledDrawer>
  );
}

'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5', // Indigo 600
      light: '#818CF8', // Indigo 400
      dark: '#3730A3', // Indigo 800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#EC4899', // Pink 500
      light: '#F472B6', // Pink 400
      dark: '#BE185D', // Pink 700
      contrastText: '#ffffff',
    },
    background: {
      default: '#F3F4F6', // Gray 100
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // Gray 900
      secondary: '#4B5563', // Gray 600
    },
  },
  typography: {
    fontFamily: 'var(--font-poppins)',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      color: '#111827',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: '#1F2937',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#111827',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: '#ffffff',
          boxShadow: '4px 0 24px 0 rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgb(79 70 229 / 0.3), 0 2px 4px -2px rgb(79 70 229 / 0.3)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(79 70 229 / 0.4), 0 4px 6px -2px rgb(79 70 229 / 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F9FAFB',
          color: '#374151',
        },
        root: {
          borderBottom: '1px solid #F3F4F6',
        },
      },
    },
  },
});

export default theme;

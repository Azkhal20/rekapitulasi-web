'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#696CFF', // Blue-ish purple from reference (Sneat style)
      light: '#E7E7FF',
      dark: '#5F61E6',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F5F9', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#566a7f', // Dark gray text
      secondary: '#a1acb8', // Lighter gray for secondary text
    },
  },
  typography: {
    fontFamily: 'var(--font-poppins)',
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#566a7f',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#566a7f',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
      color: '#566a7f',
    },
    body1: {
      fontSize: '0.9375rem', // ~15px
      color: '#566a7f',
    },
    body2: {
      fontSize: '0.8125rem', // ~13px
      color: '#a1acb8',
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      color: '#566a7f',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#a1acb8',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff', // Transparent/White
          color: '#566a7f',
          boxShadow: 'none',
          borderBottom: 'none', // No border
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: '#ffffff',
          boxShadow: '0 .125rem .25rem rgba(161,172,184,0.4)', // Subtle shadow
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: '0 2px 4px 0 rgba(105, 108, 255, 0.4)',
        },
        contained: {
          boxShadow: '0 2px 4px 0 rgba(105, 108, 255, 0.4)',
          '&:hover': {
            boxShadow: '0 4px 8px 0 rgba(105, 108, 255, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
          border: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#ffffff',
          color: '#566a7f',
          borderBottom: '1px solid #e7e7e8',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
        },
        root: {
          borderBottom: '1px solid #e7e7e8',
          fontSize: '0.875rem',
          color: '#697a8d',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(67, 89, 113, 0.04) !important',
          },
        },
      },
    },
  },
});

export default theme;

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import '../styles/globals.css';
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Rekapitulasi Data",
};

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export default function RootLayout(props) {
  const { children } = props;
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

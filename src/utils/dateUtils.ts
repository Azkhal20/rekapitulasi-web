/**
 * Utilitas tanggal untuk menangani format Google Sheets (DD MMM YYYY)
 */

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", mei: "05", jun: "06",
  jul: "07", agu: "08", sep: "09", okt: "10", nov: "11", des: "12",
  januari: "01", februari: "02", maret: "03", april: "04", agustus: "08",
  september: "09", oktober: "10", november: "11", desember: "12",
};

export const parseDateFromSheet = (displayDate: string): string => {
  if (!displayDate) return "";
  const cleanDate = displayDate.trim();

  // Already ISO?
  if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) return cleanDate;

  try {
    const parts = cleanDate.split(/\s+/);
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, "0");
      const monthStr = parts[1].toLowerCase();
      const year = parts[2];
      
      const mon = MONTH_MAP[monthStr.substring(0, 3)] || "01";
      return `${year}-${mon}-${day}`;
    }
  } catch (e) {
    console.error("Date parsing error:", e);
  }
  return displayDate;
};

export const formatDateForSheet = (isoDate: string): string => {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  try {
    const [year, month, day] = isoDate.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  return months[monthIndex] || "";
};

export const getCurrentSheetName = (): string => {
  const now = new Date();
  return `${getMonthName(now.getMonth())} ${now.getFullYear()}`;
};

export const isWithinOperationalHours = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Jam 08:00 - 16:00
  return hours >= 8 && hours < 16;
};

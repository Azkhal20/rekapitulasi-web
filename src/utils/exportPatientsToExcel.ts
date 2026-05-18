import ExcelJS from "exceljs";
import { PatientData } from "../services/patientService";

interface PatientExportParams {
  patients: PatientData[];
  sheetName: string;
  poliType: "umum" | "gigi";
}

export async function exportPatientsToExcel({
  patients,
  sheetName,
  poliType,
}: PatientExportParams) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data Pasien", {
    views: [{ showGridLines: true }],
  });

  // Base theme color based on Poli
  const isGigi = poliType === "gigi";
  const themeColor = isGigi ? "FFEC4899" : "FF4F46E5"; // Pink for Gigi, Indigo/Blue for Umum
  const themeName = isGigi ? "POLI GIGI" : "POLI UMUM";

  let currentRow = 1;

  // Title Section
  sheet.mergeCells(`A${currentRow}:T${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = `REKAP DATA PASIEN - ${themeName}`;
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: themeColor },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(currentRow).height = 35;
  currentRow++;

  // Metadata Section
  sheet.mergeCells(`A${currentRow}:T${currentRow}`);
  const metaCell = sheet.getCell(`A${currentRow}`);
  metaCell.value = `Periode Bulan: ${sheetName}  |  Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`;
  metaCell.font = { name: "Segoe UI", size: 11, italic: true };
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(currentRow).height = 25;
  currentRow++;
  currentRow++; // Empty row spacing

  // Define Table Headers
  const headers = [
    "No",
    "Tanggal",
    "Hari",
    "Bulan",
    "Tahun",
    "16-15",
    "L",
    "P",
    "Baru",
    "Lama",
    "Nama Pasien",
    "Usia",
    "NIP / Identitas",
    "Pendaftaran",
    "Obs TTV",
    "Keluhan",
    "Diagnosis",
    "ICD-10",
    "Tindakan",
    "Obat",
  ];

  const headerRow = sheet.getRow(currentRow);
  headerRow.values = headers;
  headerRow.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF374151" }, // Charcoal gray
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF9CA3AF" } },
      bottom: { style: "medium", color: { argb: "FF1F2937" } },
      left: { style: "thin", color: { argb: "FF9CA3AF" } },
      right: { style: "thin", color: { argb: "FF9CA3AF" } },
    };
  });
  sheet.getRow(currentRow).height = 25;
  currentRow++;

  // Add Patient Data Rows
  patients.forEach((patient, idx) => {
    const row = sheet.getRow(currentRow);
    const tipeDaftar = (patient.TIPE_DAFTAR || (patient as Record<string, unknown>)["Tipe Daftar"] || (patient as Record<string, unknown>)["TIPE DAFTAR"] || "Offline").trim();
    
    row.values = [
      idx + 1,
      patient.TANGGAL || "-",
      patient.HARI || "-",
      patient.BULAN || "-",
      patient.TAHUN || "-",
      patient["16-15"] || patient.ENAM_BELAS_LIMA_BELAS || "-",
      patient.L || "-",
      patient.P || "-",
      patient.BARU || "-",
      patient.LAMA || "-",
      patient.NAMA || "-",
      patient.USIA || "-",
      patient.NIP || "-",
      tipeDaftar,
      patient.OBS_TTV || (patient as Record<string, unknown>)["OBS TTV"] || "-",
      patient.KELUHAN || "-",
      patient.DIAGNOSIS || "-",
      patient.ICD10 || (patient as Record<string, unknown>)["ICD-10"] || "-",
      patient.TINDAKAN || "-",
      patient.OBAT || "-",
    ];

    row.font = { name: "Segoe UI", size: 10 };
    
    // Style normal borders and alignment
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };

      // Alignment defaults
      if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 18].includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      // Zebra striping for empty rows (light gray)
      if (idx % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }
    });

    // Custom background styling for Patient Name (Column 11) and Pendaftaran (Column 14)
    const isOnline = tipeDaftar.toLowerCase() === "online";
    const nameCell = row.getCell(11);
    const typeCell = row.getCell(14);

    if (isOnline) {
      // Soft green background for Online patients
      const onlineFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F5E9" }, // Modern soft green
      };
      
      nameCell.fill = onlineFill;
      nameCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1B5E20" } }; // Dark green text

      typeCell.fill = onlineFill;
      typeCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1B5E20" } };
    } else {
      // Soft grey background for Offline patients
      const offlineFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" }, // Soft slate slate-100
      };

      nameCell.fill = offlineFill;
      nameCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF334155" } }; // Slate text

      typeCell.fill = offlineFill;
      typeCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF334155" } };
    }

    sheet.getRow(currentRow).height = 22;
    currentRow++;
  });

  // Set custom column widths
  const colWidths = [
    5,   // No
    14,  // Tanggal
    10,  // Hari
    12,  // Bulan
    8,   // Tahun
    8,   // 16-15
    5,   // L
    5,   // P
    7,   // Baru
    7,   // Lama
    25,  // Nama Pasien (lebar untuk nama panjang)
    8,   // Usia
    20,  // NIP / Identitas
    15,  // Pendaftaran (Tipe Daftar)
    25,  // Obs TTV
    30,  // Keluhan
    25,  // Diagnosis
    15,  // ICD-10
    25,  // Tindakan
    30,  // Obat
  ];

  colWidths.forEach((width, colIdx) => {
    sheet.getColumn(colIdx + 1).width = width;
  });

  // Generate and download spreadsheet
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const formattedMonth = sheetName.replace(/\s+/g, "_");
  const filename = `Data_Pasien_${themeName.replace(/\s+/g, "_")}_${formattedMonth}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

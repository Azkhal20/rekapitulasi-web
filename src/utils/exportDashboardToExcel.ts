import ExcelJS from "exceljs";

interface DashboardExportData {
  month: string;
  year: string;
  // Real-time Stats
  totalPatients: number;
  todayPatients: number;
  todayGender: { L: number; P: number };
  todayType: { baru: number; lama: number };
  // Combined Stats
  combinedStats: {
    totalBothPoli: number;
    totalL: number;
    totalP: number;
    totalBaru: number;
    totalLama: number;
    periodTotals: {
      umum: { total: number; L: number; P: number; baru: number; lama: number };
      gigi: { total: number; L: number; P: number; baru: number; lama: number };
    };
  };
  // Top 10 Diagnosis
  topDiagnosis: Array<{ name: string; count: number }>;
  // Periodic Recap
  periodicRekap: Array<{
    label: string;
    total: number;
    umum: number;
    gigi: number;
  }>;
  // Selected Poli
  selectedPoli: "umum" | "gigi";
}

export async function exportDashboardToExcel(data: DashboardExportData) {
  const workbook = new ExcelJS.Workbook();

  // ===== SHEET 1: RINGKASAN STATISTIK =====
  const sheet1 = workbook.addWorksheet("Ringkasan Statistik", {
    views: [{ showGridLines: false }],
  });

  let currentRow = 1;

  // Title Section
  sheet1.mergeCells(`A${currentRow}:B${currentRow}`);
  const titleCell = sheet1.getCell(`A${currentRow}`);
  titleCell.value = "LAPORAN DASHBOARD REKAPITULASI PASIEN";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet1.getRow(currentRow).height = 30;
  currentRow++;

  // Metadata
  const metadata = [
    [`Periode: ${data.month} ${data.year}`],
    [`Poli: ${data.selectedPoli.toUpperCase()}`],
    [`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`],
  ];

  metadata.forEach((row) => {
    sheet1.mergeCells(`A${currentRow}:B${currentRow}`);
    const cell = sheet1.getCell(`A${currentRow}`);
    cell.value = row[0];
    cell.font = { name: "Segoe UI", size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    currentRow++;
  });

  currentRow++; // Empty row

  // Section: STATISTIK REAL-TIME
  sheet1.mergeCells(`A${currentRow}:B${currentRow}`);
  let sectionHeader = sheet1.getCell(`A${currentRow}`);
  sectionHeader.value = "STATISTIK REAL-TIME";
  sectionHeader.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  sectionHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0D9488" },
  };
  sectionHeader.alignment = { vertical: "middle", horizontal: "center" };
  sheet1.getRow(currentRow).height = 25;
  currentRow++;

  // Table Header
  const headerRow = sheet1.getRow(currentRow);
  headerRow.values = ["Kategori", "Nilai"];
  headerRow.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });
  currentRow++;

  // Data rows
  const statsData = [
    ["Total Pasien (Periode Ini)", data.totalPatients],
    ["Kunjungan Hari Ini", data.todayPatients],
    ["Gender Hari Ini - Laki-laki", data.todayGender.L],
    ["Gender Hari Ini - Perempuan", data.todayGender.P],
    ["Tipe Pasien Hari Ini - Baru", data.todayType.baru],
    ["Tipe Pasien Hari Ini - Lama", data.todayType.lama],
  ];

  statsData.forEach((rowData, index) => {
    const row = sheet1.getRow(currentRow);
    row.values = rowData;
    row.font = { name: "Segoe UI", size: 10 };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).font = { name: "Segoe UI", size: 10, bold: true };

    // Alternating row colors
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFAFAFA" },
        };
      });
    }
    currentRow++;
  });

  currentRow++; // Empty row

  // Section: RINGKASAN GABUNGAN
  sheet1.mergeCells(`A${currentRow}:B${currentRow}`);
  sectionHeader = sheet1.getCell(`A${currentRow}`);
  sectionHeader.value = "RINGKASAN GABUNGAN (UMUM & GIGI)";
  sectionHeader.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  sectionHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0D9488" },
  };
  sectionHeader.alignment = { vertical: "middle", horizontal: "center" };
  sheet1.getRow(currentRow).height = 25;
  currentRow++;

  // Table Header
  const headerRow2 = sheet1.getRow(currentRow);
  headerRow2.values = ["Kategori", "Nilai"];
  headerRow2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow2.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  currentRow++;

  const combinedData = [
    ["Total Kedua Poli", data.combinedStats.totalBothPoli],
    ["Total Laki-laki", data.combinedStats.totalL],
    ["Total Perempuan", data.combinedStats.totalP],
    ["Total Pasien Baru", data.combinedStats.totalBaru],
    ["Total Pasien Lama", data.combinedStats.totalLama],
  ];

  combinedData.forEach((rowData, index) => {
    const row = sheet1.getRow(currentRow);
    row.values = rowData;
    row.font = { name: "Segoe UI", size: 10 };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).font = { name: "Segoe UI", size: 10, bold: true };

    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFAFAFA" },
        };
      });
    }
    currentRow++;
  });

  currentRow++; // Empty row

  // Section: PERINCIAN PER POLI
  sheet1.mergeCells(`A${currentRow}:F${currentRow}`);
  sectionHeader = sheet1.getCell(`A${currentRow}`);
  sectionHeader.value = "PERINCIAN PER POLI";
  sectionHeader.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  sectionHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0D9488" },
  };
  sectionHeader.alignment = { vertical: "middle", horizontal: "center" };
  sheet1.getRow(currentRow).height = 25;
  currentRow++;

  // Table Header
  const headerRow3 = sheet1.getRow(currentRow);
  headerRow3.values = ["Poli", "Total", "L", "P", "Baru", "Lama"];
  headerRow3.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow3.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  currentRow++;

  const poliData = [
    [
      "Poli Umum",
      data.combinedStats.periodTotals.umum.total,
      data.combinedStats.periodTotals.umum.L,
      data.combinedStats.periodTotals.umum.P,
      data.combinedStats.periodTotals.umum.baru,
      data.combinedStats.periodTotals.umum.lama,
    ],
    [
      "Poli Gigi",
      data.combinedStats.periodTotals.gigi.total,
      data.combinedStats.periodTotals.gigi.L,
      data.combinedStats.periodTotals.gigi.P,
      data.combinedStats.periodTotals.gigi.baru,
      data.combinedStats.periodTotals.gigi.lama,
    ],
  ];

  poliData.forEach((rowData, index) => {
    const row = sheet1.getRow(currentRow);
    row.values = rowData;
    row.font = { name: "Segoe UI", size: 10 };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    for (let i = 2; i <= 6; i++) {
      row.getCell(i).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(i).font = { name: "Segoe UI", size: 10, bold: true };
    }

    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFAFAFA" },
        };
      });
    }
    currentRow++;
  });

  // Set column widths
  sheet1.getColumn(1).width = 35;
  sheet1.getColumn(2).width = 15;
  sheet1.getColumn(3).width = 12;
  sheet1.getColumn(4).width = 12;
  sheet1.getColumn(5).width = 12;
  sheet1.getColumn(6).width = 12;

  // ===== SHEET 2: TOP 10 DIAGNOSIS =====
  if (data.topDiagnosis.length > 0) {
    const sheet2 = workbook.addWorksheet("Top 10 Diagnosis", {
      views: [{ showGridLines: false }],
    });

    currentRow = 1;

    // Title
    sheet2.mergeCells(`A${currentRow}:C${currentRow}`);
    const title2 = sheet2.getCell(`A${currentRow}`);
    title2.value = "TOP 10 DIAGNOSIS TERBANYAK";
    title2.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    title2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDB2777" },
    };
    title2.alignment = { vertical: "middle", horizontal: "center" };
    sheet2.getRow(currentRow).height = 30;
    currentRow++;

    // Metadata
    sheet2.mergeCells(`A${currentRow}:C${currentRow}`);
    let metaCell = sheet2.getCell(`A${currentRow}`);
    metaCell.value = `Poli: ${data.selectedPoli.toUpperCase()}`;
    metaCell.font = { name: "Segoe UI", size: 11 };
    metaCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    metaCell.alignment = { vertical: "middle", horizontal: "center" };
    currentRow++;

    sheet2.mergeCells(`A${currentRow}:C${currentRow}`);
    metaCell = sheet2.getCell(`A${currentRow}`);
    metaCell.value = `Periode: ${data.month} ${data.year}`;
    metaCell.font = { name: "Segoe UI", size: 11 };
    metaCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    metaCell.alignment = { vertical: "middle", horizontal: "center" };
    currentRow++;

    currentRow++; // Empty row

    // Table Header
    const diagnosisHeader = sheet2.getRow(currentRow);
    diagnosisHeader.values = ["No", "Diagnosis", "Jumlah Pasien"];
    diagnosisHeader.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    diagnosisHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF475569" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    currentRow++;

    // Data rows
    data.topDiagnosis.forEach((item, index) => {
      const row = sheet2.getRow(currentRow);
      row.values = [index + 1, item.name, item.count];
      row.font = { name: "Segoe UI", size: 10 };
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(3).font = { name: "Segoe UI", size: 10, bold: true };

      // Top 3 highlight
      if (index < 3) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Light yellow
          };
        });
      } else if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          };
        });
      }
      currentRow++;
    });

    // Set column widths
    sheet2.getColumn(1).width = 8;
    sheet2.getColumn(2).width = 45;
    sheet2.getColumn(3).width = 18;
  }

  // ===== SHEET 3: REKAP PER PERIODE =====
  if (data.periodicRekap.length > 0) {
    const sheet3 = workbook.addWorksheet("Rekap Per Periode", {
      views: [{ showGridLines: false }],
    });

    currentRow = 1;

    // Title
    sheet3.mergeCells(`A${currentRow}:D${currentRow}`);
    const title3 = sheet3.getCell(`A${currentRow}`);
    title3.value = "REKAP TOTAL KUNJUNGAN PASIEN PER PERIODE";
    title3.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    title3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" },
    };
    title3.alignment = { vertical: "middle", horizontal: "center" };
    sheet3.getRow(currentRow).height = 30;
    currentRow++;

    // Metadata
    sheet3.mergeCells(`A${currentRow}:D${currentRow}`);
    const yearCell = sheet3.getCell(`A${currentRow}`);
    yearCell.value = `Tahun: ${data.year}`;
    yearCell.font = { name: "Segoe UI", size: 11 };
    yearCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    yearCell.alignment = { vertical: "middle", horizontal: "center" };
    currentRow++;

    currentRow++; // Empty row

    // Table Header
    const periodHeader = sheet3.getRow(currentRow);
    periodHeader.values = ["Periode", "Total Gabungan", "Poli Umum", "Poli Gigi"];
    periodHeader.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    periodHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF475569" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    currentRow++;

    // Data rows
    data.periodicRekap.forEach((item, index) => {
      const row = sheet3.getRow(currentRow);
      row.values = [item.label, item.total, item.umum, item.gigi];
      row.font = { name: "Segoe UI", size: 10 };
      row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(2).font = { name: "Segoe UI", size: 10, bold: true };
      row.getCell(3).font = { name: "Segoe UI", size: 10, bold: true };
      row.getCell(4).font = { name: "Segoe UI", size: 10, bold: true };

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          };
        });
      }
      currentRow++;
    });

    currentRow++; // Empty row

    // Total row
    const totalRow = sheet3.getRow(currentRow);
    totalRow.values = [
      "TOTAL TAHUN " + data.year,
      data.periodicRekap.reduce((a, b) => a + b.total, 0),
      data.periodicRekap.reduce((a, b) => a + b.umum, 0),
      data.periodicRekap.reduce((a, b) => a + b.gigi, 0),
    ];
    totalRow.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E293B" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    sheet3.getRow(currentRow).height = 25;

    // Set column widths
    sheet3.getColumn(1).width = 40;
    sheet3.getColumn(2).width = 18;
    sheet3.getColumn(3).width = 15;
    sheet3.getColumn(4).width = 15;
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const monthName = data.month.charAt(0).toUpperCase() + data.month.slice(1);
  const filename = `Laporan_Dashboard_${monthName}_${data.year}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

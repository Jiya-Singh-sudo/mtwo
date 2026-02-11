import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { extractISODate, formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportRoomOccupancyExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Room & Housekeeping');

  /* ================= COLUMN WIDTHS ================= */
  sheet.columns = [
    { width: 28 }, // Guest Name
    { width: 16 }, // Room Allotted
    { width: 22 }, // Housekeeper Allotted
    { width: 18 }, // Cleaning Type
    { width: 14 }, // Check-In
    { width: 14 }, // Check-Out
    { width: 26 }, // Remarks
  ];

  /* ================= HEADER ================= */

  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = 'GUEST MANAGEMENT SYSTEM (GMS)';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = 'GUEST-WISE ROOM & HOUSEKEEPING REPORT';
  sheet.getCell('A2').font = { bold: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:G3');
  sheet.getCell('A3').value = 'Raj Bhawan, Maharashtra';
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  /* ================= PERIOD ================= */

  const fromLabel = formatDDMMYYYY(payload.fromDate);
  const toLabel   = formatDDMMYYYY(payload.toDate);

  sheet.mergeCells('A4:G4');
  sheet.getCell('A4').value =
    payload.fromDate === payload.toDate
      ? `Period: ${fromLabel}`
      : `Period: ${fromLabel} – ${toLabel}`;

  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('A4').alignment = { horizontal: 'center' };

  /* ================= TABLE HEADER ================= */

  sheet.addRow([]);

  const headerRow = sheet.addRow([
    'Guest Name',
    'Room Allotted',
    'Housekeeper Allotted',
    'Cleaning Type',
    'Check-In',
    'Check-Out',
    'Remarks',
  ]);

  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  /* ================= DATA ROWS ================= */

  payload.rows.forEach(r => {
    const checkIn  = formatDDMMYYYY(extractISODate(r.check_in_date));
    const checkOut = formatDDMMYYYY(extractISODate(r.check_out_date));

    sheet.addRow([
      r.guest_name ?? '',
      r.room_no ?? '',
      r.housekeeper ?? '',
      r.cleaning_type ?? '',
      checkIn,
      checkOut,
      r.remarks ?? '',
    ]);
  });

  /* ================= BORDERS ================= */

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 6) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  /* ================= FOOTER ================= */

  sheet.addRow([]);
  sheet.addRow(['Prepared By', 'GMS Admin']);
  sheet.addRow(['Verified By', 'Secretary, Raj Bhawan']);
  sheet.addRow(['Approved By', 'Honourable Governor of Maharashtra']);

  sheet.getRow(sheet.lastRow!.number - 2).getCell(1).font = { bold: true };
  sheet.getRow(sheet.lastRow!.number - 1).getCell(1).font = { bold: true };
  sheet.getRow(sheet.lastRow!.number).getCell(1).font = { bold: true };

  /* ================= SAVE ================= */

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(
    reportsDir,
    `Room_Housekeeping_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

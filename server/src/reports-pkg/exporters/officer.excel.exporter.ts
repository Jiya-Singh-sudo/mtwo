import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportOfficerSummaryExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Officer Summary');

  /* ================= COLUMN WIDTHS ================= */

  sheet.columns = [
    { width: 10 }, // Sr No
    { width: 28 }, // Officer Name
    { width: 22 }, // Designation
    { width: 18 }, // Primary Mobile
    { width: 28 }, // Email
    { width: 18 }, // Role
    { width: 18 }, // Guest Count
    { width: 20 }, // Assignment Start
    { width: 20 }, // Assignment End
    { width: 24 }, // Duty Location
    { width: 30 }, // Medical Services
    { width: 22 }, // Status
  ];

  /* ================= HEADER ================= */

  sheet.mergeCells('A1:L1');
  sheet.getCell('A1').value = 'GUEST MANAGEMENT SYSTEM (GMS)';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:L2');
  sheet.getCell('A2').value = 'OFFICER SUMMARY REPORT';
  sheet.getCell('A2').font = { bold: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:L3');
  sheet.getCell('A3').value = 'Raj Bhawan, Maharashtra';
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  const rangeLabel =
    payload.fromDate === payload.toDate
      ? formatDDMMYYYY(payload.fromDate)
      : `${formatDDMMYYYY(payload.fromDate)} – ${formatDDMMYYYY(payload.toDate)}`;

  sheet.mergeCells('A4:L4');
  sheet.getCell('A4').value = `Period: ${rangeLabel}`;
  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('A4').alignment = { horizontal: 'center' };

  /* ================= TABLE HEADER ================= */

  const headerRow = sheet.addRow([
    'Sr No',
    'Officer Name',
    'Designation',
    'Primary Mobile',
    'Email',
    'Officer Role',
    'Assigned Guests',
    'Assignment Start Date',
    'Assignment End Date',
    'Duty Location',
    'Medical Service',
    'Status',
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

  payload.rows.forEach((r, index) => {
    sheet.addRow([
      index + 1,
      r.officer_name ?? '',
      r.designation ?? '',
      r.primary_mobile ?? '',
      r.email ?? '',
      r.officer_role ?? '',
      r.assigned_guest_count ?? 0,
      r.assignment_start_date
        ? formatDDMMYYYY(r.assignment_start_date)
        : '',
      r.assignment_end_date
        ? formatDDMMYYYY(r.assignment_end_date)
        : '',
      r.duty_location ?? '',
      r.medical_service ?? '',
      r.is_active ? 'Active' : 'Inactive',
    ]);
  });

  /* ================= ROW BORDER ================= */

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
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

  /* ================= SAVE FILE ================= */

  const reportsDir = path.join(process.cwd(), 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(
    reportsDir,
    `Officer_Summary_Report_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

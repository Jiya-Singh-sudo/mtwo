import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportVehicleDriverExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Vehicle & Driver Transactions');

  /* ================= COLUMN WIDTHS ================= */
  sheet.columns = [
    { width: 14 }, // Trip Date
    { width: 24 }, // Guest Name
    { width: 22 }, // Driver Name
    { width: 18 }, // Driver License
    { width: 14 }, // Vehicle No
    { width: 18 }, // Vehicle Name
    { width: 22 }, // Pickup Location
    { width: 22 }, // Drop Location
    { width: 14 }, // Start Time
    { width: 14 }, // End Time
    { width: 16 }, // Trip Status
    { width: 26 }, // Remarks
  ];

  /* ================= HEADER ================= */

  sheet.mergeCells('A1:L1');
  sheet.getCell('A1').value = 'GUEST MANAGEMENT SYSTEM (GMS)';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:L2');
  sheet.getCell('A2').value = 'VEHICLE & DRIVER TRANSACTION REPORT';
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
    'Trip Date',
    'Guest Name',
    'Driver Name',
    'Driver License',
    'Vehicle No',
    'Vehicle Name',
    'Pickup Location',
    'Drop Location',
    'Start Time',
    'End Time',
    'Trip Status',
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
    sheet.addRow([
      formatDDMMYYYY(r.trip_date),
      r.guest_name ?? '',
      r.driver_name ?? '',
      r.driver_license ?? '',
      r.vehicle_no ?? '',
      r.vehicle_name ?? '',
      r.pickup_location ?? r.from_location ?? '',
      r.drop_location ?? r.to_location ?? '',
      r.start_time ?? '',
      r.end_time ?? '',
      r.trip_status ?? '',
      r.remarks ?? '',
    ]);
  });

  /* ================= BORDERS ================= */

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 5) {
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

  /* ================= SAVE FILE ================= */

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(
    reportsDir,
    `Vehicle_Driver_Transactions_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

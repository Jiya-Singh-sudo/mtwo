import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportNetworkExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Network Transactions');

  /* ================= COLUMN WIDTHS ================= */
  sheet.columns = [
    { width: 14 }, // Start Date
    { width: 12 }, // Start Time
    { width: 14 }, // End Date
    { width: 12 }, // End Time
    { width: 24 }, // Guest Name
    { width: 12 }, // Room No
    { width: 20 }, // Provider
    { width: 16 }, // Network Type
    { width: 14 }, // Bandwidth
    { width: 18 }, // Zone From
    { width: 18 }, // Zone To
    { width: 16 }, // Network Status
    { width: 20 }, // Messenger
    { width: 28 }, // Description
    { width: 28 }, // Remarks
  ];

  /* ================= HEADER ================= */

  sheet.mergeCells('A1:O1');
  sheet.getCell('A1').value = 'NETWORK TRANSACTION REPORT';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:O2');
  sheet.getCell('A2').value = 'Raj Bhawan, Maharashtra';
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  const rangeLabel =
    payload.fromDate === payload.toDate
      ? formatDDMMYYYY(payload.fromDate)
      : `${formatDDMMYYYY(payload.fromDate)} – ${formatDDMMYYYY(payload.toDate)}`;

  sheet.mergeCells('A3:O3');
  sheet.getCell('A3').value = `Period: ${rangeLabel}`;
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  /* ================= TABLE HEADER ================= */

  const headerRow = sheet.addRow([
    'Start Date',
    'Start Time',
    'End Date',
    'End Time',
    'Guest Name',
    'Room No',
    'Provider',
    'Network Type',
    'Bandwidth (Mbps)',
    'Zone From',
    'Zone To',
    'Network Status',
    'Messenger',
    'Description',
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
      r.start_date ? formatDDMMYYYY(r.start_date) : '',
      r.start_time ?? '',
      r.end_date ? formatDDMMYYYY(r.end_date) : '',
      r.end_time ?? '',
      r.guest_name ?? '',
      r.room_id ?? '',
      r.provider_name ?? '',
      r.network_type ?? '',
      r.bandwidth_mbps ?? '',
      r.network_zone_from ?? '',
      r.network_zone_to ?? '',
      r.network_status ?? '',
      r.messenger_name ?? '',
      r.description ?? '',
      r.remarks ?? '',
    ]);
  });

  /* ================= BORDERS ================= */

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
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

  /* ================= SAVE FILE ================= */

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(
    reportsDir,
    `Network_Transactions_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { extractISODate, formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportGuestSummaryExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const isMr =  payload.language === 'mr';
  const sheet = workbook.addWorksheet('Guest Summary');
  /* ================= COLUMN WIDTHS ================= */
  sheet.columns = [
    { width: 30 }, // Guest Name & Designation
    { width: 12 }, // Room No
    { width: 18 }, // Housekeeper
    { width: 16 }, // Butler
    { width: 18 }, // Food / Remarks
    { width: 14 }, // Vehicle No
    { width: 18 }, // Driver Name
    { width: 18 }, // Pickup-Drop
    { width: 16 }, // Messenger
    { width: 14 }, // Wi-Fi Pass
    { width: 18 }, // Network Remarks
    { width: 12 }, // Stay From
    { width: 12 }, // Stay To
    { width: 12 }, // Total Days
    { width: 14 }, // Visit Type
    { width: 22 }, // Exceptions / Notes
  ];


  /* ================= HEADER ================= */

  sheet.mergeCells('A1:P1');
  sheet.getCell('A1').value = isMr ? 'GUEST MANAGEMENT SYSTEM (GMS)' : 'GUEST MANAGEMENT SYSTEM (GMS)';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:P2');
  sheet.getCell('A2').value = isMr ? 'MONTHLY GUEST-WISE ALLOCATION & STAY REPORT' : 'MONTHLY GUEST-WISE ALLOCATION & STAY REPORT';
  sheet.getCell('A2').font = { bold: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:P3');
  sheet.getCell('A3').value = isMr ? 'Raj Bhawan, Maharashtra' : 'Raj Bhawan, Maharashtra';
  sheet.getCell('A3').alignment = { horizontal: 'center' };
  /* ================= MONTH HEADER ================= */

const fromDate = new Date(payload.fromDate);
const toDate = new Date(payload.toDate);

// const monthLabel = fromDate.toLocaleString('en-IN', {
//   month: 'long',
//   year: 'numeric',
// });

  const fromLabel = fromDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const toLabel = toDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const rangeLabel =
    payload.fromDate === payload.toDate
      ? formatDDMMYYYY(fromLabel)
      : `${formatDDMMYYYY(fromLabel)} – ${formatDDMMYYYY(toLabel)}`;

  sheet.getCell('A4').value = `Period: ${rangeLabel}`;

  sheet.mergeCells('A4:P4');
  sheet.getCell('A4').value = `Month: ${rangeLabel} (${fromLabel} – ${toLabel})`;
  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('A4').alignment = { horizontal: 'center' };


  /* ================= TABLE HEADER ================= */

  // const headerRow = sheet.addRow([
  //   'Guest Name & Designation',
  //   'Room No',
  //   'Housekeeper',
  //   'Butler',
  //   'Food / Remarks',
  //   'Vehicle No',
  //   'Driver Name',
  //   'Pickup-Drop',
  //   'Messenger',
  //   'Wi-Fi Pass',
  //   'Network Remarks',
  //   'Stay From',
  //   'Stay To',
  //   'Total Days',
  //   'Visit Type',
  //   'Exceptions / Notes',
  // ]);
  const headerRow = sheet.addRow([
    isMr ? 'अतिथी नाव व पद' : 'Guest Name & Designation',
    isMr ? 'कक्ष क्र.' : 'Room No',
    isMr ? 'हाऊसकीपर' : 'Housekeeper',
    isMr ? 'बटलर' : 'Butler',
    isMr ? 'अन्न / नोंदी' : 'Food / Remarks',
    isMr ? 'वाहन क्र.' : 'Vehicle No',
    isMr ? 'चालक नाव' : 'Driver Name',
    isMr ? 'पिकअप - ड्रॉप' : 'Pickup-Drop',
    isMr ? 'मेसेन्जर' : 'Messenger',
    isMr ? 'वाई-फाय' : 'Wi-Fi Pass',
    isMr ? 'नेटवर्क नोंदी' : 'Network Remarks',
    isMr ? 'प्रवेश तारीख' : 'Stay From',
    isMr ? 'निर्गमन तारीख' : 'Stay To',
    isMr ? 'एकूण दिवस' : 'Total Days',
    isMr ? 'भेट प्रकार' : 'Visit Type',
    isMr ? 'विशेष नोंदी' : 'Exceptions / Notes',
  ]);

  headerRow.eachCell((cell) => {
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

  let totalGuestDays = 0;

  payload.rows.forEach((r) => {
  const entryDate = extractISODate(r.entry_date);
  const exitDate  = extractISODate(r.exit_date);
  const entryDateE = formatDDMMYYYY(entryDate);
  const exitDateE  = formatDDMMYYYY(exitDate);
  const days =
    entryDate && exitDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(exitDate).getTime() - new Date(entryDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 1;

    totalGuestDays += days;

    sheet.addRow([
      r.guest_name ?? '',
      r.room_no ?? '',
      r.housekeeper ?? '',
      r.butler ?? '',
      r.food_remarks ?? '',
      r.vehicle_no ?? '',
      r.driver_name ?? '',
      r.pickup_drop ?? '',
      r.messenger ?? '',
      r.wifi_provider ?? '',
      r.network_remarks ?? '',
      // formatISTDate(r.entry_date),
      // formatISTDate(r.exit_date),
      entryDateE,
      exitDateE,
      days,
      r.visit_type ?? '',
      r.exceptions ?? '',
    ]);
  });
  /* ================= DATE FORMATTING ================= */

  sheet.getColumn(12).numFmt = 'dd mmm yyyy';
  sheet.getColumn(13).numFmt = 'dd mmm yyyy';
  sheet.getColumn(14).alignment = { horizontal: 'center' };

  /* ================= TABLE BORDERS ================= */

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  /* ================= SUMMARY ================= */

  sheet.addRow([]);

  const totalGuestsRow = sheet.addRow([isMr ? 'एकूण अतिथी' : 'Total Guests', payload.rows.length]);
  const totalDaysRow = sheet.addRow([isMr ? 'एकूण दिवस' : 'Total Guest Days', totalGuestDays]);

  totalGuestsRow.font = { bold: true };
  totalDaysRow.font = { bold: true };


  /* ================= FOOTER ================= */
  sheet.addRow([]);
sheet.addRow([
  isMr ? 'तयार केले' : 'Prepared By',
  isMr ? 'GMS प्रशासक' : 'GMS Admin'
]);

sheet.addRow([
  isMr ? 'तपासले' : 'Verified By',
  isMr ? 'सचिव, राजभवन' : 'Secretary, Raj Bhawan'
]);

sheet.addRow([
  isMr ? 'मंजूर केले' : 'Approved By',
  isMr ? 'महाराष्ट्र राज्यपाल' : 'Honorable Governor of Maharashtra'
]);

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
    `Guest_Summary_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

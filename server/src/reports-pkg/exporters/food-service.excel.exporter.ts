import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { formatDDMMYYYY } from '../../../common/utlis/date-utlis';

export async function exportFoodServiceExcel(payload: {
  rows: any[];
  fromDate: string;
  toDate: string;
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Food Service');

  sheet.columns = [
    { width: 14 }, // Plan Date
    { width: 22 }, // Guest
    { width: 12 }, // Room
    { width: 18 }, // Butler
    { width: 22 }, // Food
    { width: 14 }, // Food Type
    { width: 14 }, // Meal Type
    { width: 10 }, // Qty
    { width: 14 }, // Stage
    { width: 22 }, // Order Time
    { width: 22 }, // Delivered Time
    { width: 16 }, // Status
    { width: 26 }, // Remarks
  ];

  sheet.mergeCells('A1:M1');
  sheet.getCell('A1').value = 'FOOD SERVICE TRANSACTION REPORT';
  sheet.getCell('A1').font = { bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:M2');
  sheet.getCell('A2').value = `Period: ${formatDDMMYYYY(payload.fromDate)} – ${formatDDMMYYYY(payload.toDate)}`;
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  const header = sheet.addRow([
    'Plan Date',
    'Guest Name',
    'Room',
    'Butler',
    'Food Item',
    'Food Type',
    'Meal Type',
    'Quantity',
    'Food Stage',
    'Order DateTime',
    'Delivered DateTime',
    'Delivery Status',
    'Remarks',
  ]);

  header.eachCell(c => {
    c.font = { bold: true };
    c.alignment = { horizontal: 'center', wrapText: true };
    c.border = { top:{style:'thin'},left:{style:'thin'},right:{style:'thin'},bottom:{style:'thin'} };
  });

  payload.rows.forEach(r => {
    sheet.addRow([
      formatDDMMYYYY(r.plan_date),
      r.guest_name ?? '',
      r.room_id ?? '',
      r.butler_name ?? '',
      r.food_name ?? '',
      r.food_type ?? '',
      r.meal_type ?? '',
      r.quantity ?? '',
      r.food_stage ?? '',
      r.order_datetime ?? '',
      r.delivered_datetime ?? '',
      r.delivery_status ?? '',
      r.remarks ?? '',
    ]);
  });

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const filePath = path.join(
    reportsDir,
    `Food_Service_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

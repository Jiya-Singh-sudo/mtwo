import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export async function exportDriverDutyExcel(input: {
  rows: any[];
  fromDate: string;
  toDate: string;
  language?: 'en' | 'mr';
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Driver Duty');

  sheet.columns = [
    { header: 'Duty Date', key: 'duty_date', width: 14 },
    { header: 'Driver Name', key: 'driver_name', width: 24 },
    { header: 'Shift', key: 'shift', width: 12 },
    { header: 'In Time', key: 'duty_in_time', width: 12 },
    { header: 'Out Time', key: 'duty_out_time', width: 12 },
    { header: 'Week Off', key: 'is_week_off', width: 10 },
    { header: 'Contact', key: 'driver_contact', width: 16 },
    { header: 'License No', key: 'driver_license', width: 18 },
    { header: 'License Expiry', key: 'license_expiry_date', width: 16 },
  ];

  input.rows.forEach(r => {
    sheet.addRow({
      ...r,
      is_week_off: r.is_week_off ? 'Yes' : 'No',
    });
  });

  const outputDir = path.join(process.cwd(), 'generated-reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const filePath = path.join(
    outputDir,
    `Driver_Duty_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

export async function generateExcel(
  data: Record<string, any>[],
  fileName: string,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report');

  if (!data.length) {
    sheet.addRow(['No data']);
  } else {
    sheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));

    data.forEach((row) => sheet.addRow(row));
  }

  const dir = path.join(process.cwd(), 'uploads/reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${fileName}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  return `/uploads/reports/${fileName}.xlsx`;
}

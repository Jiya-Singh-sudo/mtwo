import * as fs from 'fs';
import * as path from 'path';

export function generateCsv(data: any[], fileName: string): string {
    if (!data.length) {
        throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');

    const dir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${fileName}.csv`);
    fs.writeFileSync(filePath, csv);

    return `/uploads/reports/${fileName}.csv`;
}

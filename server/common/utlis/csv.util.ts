import * as fs from 'fs';
import * as path from 'path';

export function generateCsv(data: any[], fileName: string): string {
    const dir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let csv = '';

    if (!data || !data.length) {
        csv = 'No data available';
    } else {
        const headers = Object.keys(data[0]);
        const rows = data.map((row) =>
            headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
        );
        csv = [headers.join(','), ...rows].join('\n');
    }

    const filePath = path.join(dir, `${fileName}.csv`);
    fs.writeFileSync(filePath, csv);

    return `/uploads/reports/${fileName}.csv`;
}


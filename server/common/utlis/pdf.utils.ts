import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate PDF buffer from HTML (for in-memory use like WhatsApp sending)
 */
export async function generatePdfBuffer(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm',
        },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
}

/**
 * Generate PDF and save to file (for report generation)
 */
export async function generatePdfFromHtml(html: string, filename: string): Promise<string> {
    const pdfBuffer = await generatePdfBuffer(html);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save PDF to file
    const filePath = path.join(uploadsDir, `${filename}-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    return `/uploads/reports/${path.basename(filePath)}`;
}



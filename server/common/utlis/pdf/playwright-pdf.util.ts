import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { formatDDMMYYYY } from '../date-utlis';

interface GeneratePdfOptions {
  templatePath: string;      // absolute path to .hbs
  outputFileName: string;    // without extension
  payload: any;              // template data
}
Handlebars.registerHelper('ddmmyyyy', (value) =>
  formatDDMMYYYY(value),
);
/**
 * Generate PDF from Handlebars template using Playwright
 */
export async function generatePdfFromTemplate(
  options: GeneratePdfOptions,
): Promise<string> {
  const { templatePath, outputFileName, payload } = options;

  // 1. Load template
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(templateSource);

  // 2. Generate HTML
  const html = template(payload);

  // 3. Prepare output directory
  const outputDir = path.join(process.cwd(), 'generated-reports', 'pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${outputFileName}.pdf`);

  // 4. Launch Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 5. Set HTML
  await page.setContent(html, {
    waitUntil: 'networkidle',
  });

  // 6. Generate PDF (A4 Portrait – government standard)
  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '10mm',
      right: '10mm',
    },
  });

  // 7. Cleanup
  await browser.close();

  return outputPath;
}

export async function exportPdf(reportCode: string, data: any[]) {
  // TODO: integrate pdfkit / puppeteer
  return `/reports/${reportCode}-${Date.now()}.pdf`;
}

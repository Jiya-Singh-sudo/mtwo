export async function exportExcel(reportCode: string, data: any[]) {
  // TODO: integrate exceljs
  return `/reports/${reportCode}-${Date.now()}.xlsx`;
}

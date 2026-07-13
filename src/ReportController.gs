function openReports() {

  ReportService.generate();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(ss.getSheetByName(SHEETS.REPORTS));
  ss.toast("Relatórios gerados.", APP.NAME, 4);

}

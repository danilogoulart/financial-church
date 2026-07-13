function refreshDashboard() {

  DashboardService.refresh();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(ss.getSheetByName(SHEETS.DASHBOARD));
  ss.toast("Dashboard atualizado.", APP.NAME, 4);

}

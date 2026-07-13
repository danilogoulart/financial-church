/**
 * Ponto de entrada do Web App.
 */

function doGet(e) {

  return HtmlService
    .createHtmlOutputFromFile("Index")
    .setTitle(APP.NAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");

}

/**
 * Endpoints chamados pela página (google.script.run).
 * Reaproveitam os mesmos Services usados pela planilha.
 */

function webRefreshDashboard() {

  const totals = DashboardService.refresh();

  return {
    income: totals.totalIncome,
    expense: totals.totalExpense,
    balance: totals.balance
  };

}

function webGenerateReports() {

  ReportService.generate();

  return true;

}

function webSpreadsheetUrl() {

  return Database.spreadsheet().getUrl();

}

/**
 * Mostra a URL do Web App implantado (menu da planilha).
 */
function showWebAppUrl() {

  const url = ScriptApp.getService().getUrl();

  const ui = SpreadsheetApp.getUi();

  if (!url) {
    ui.alert(
      APP.NAME,
      "O Web App ainda não foi implantado.\n\n" +
      "Vá em Implantar → Nova implantação → App da Web para gerar a URL.",
      ui.ButtonSet.OK
    );
    return;
  }

  ui.alert(APP.NAME, "URL do Web App:\n\n" + url, ui.ButtonSet.OK);

}

/**
 * Financial Church
 * Menu principal
 */

class Menu {

  static build() {

    SpreadsheetApp.getUi()

      .createMenu("🏛 Financial Church")

      .addItem("🚀 Instalar Sistema", "install")

      .addSeparator()

      .addItem("👤 Novo Membro", "showMemberForm")

      .addItem("💰 Nova Movimentação", "showTransactionForm")

      .addItem("📄 Nova Conta a Pagar", "showPayableForm")

      .addSeparator()

      .addItem("📊 Atualizar Dashboard", "refreshDashboard")

      .addItem("📑 Relatórios", "openReports")

      .addToUi();

  }

}

/**
 * Próximas implementações
 */

function showMemberForm() {

  const html = HtmlService
    .createHtmlOutputFromFile("Member")
    .setWidth(500)
    .setHeight(520);

  SpreadsheetApp
    .getUi()
    .showModalDialog(html, "Novo Membro");

}

function showTransactionForm() {

  SpreadsheetApp
    .getUi()
    .alert("Cadastro de movimentações será implementado no próximo commit.");

}

function showPayableForm() {

  SpreadsheetApp
    .getUi()
    .alert("Contas a pagar será implementado no próximo commit.");

}

function refreshDashboard() {

  SpreadsheetApp
    .getUi()
    .alert("Dashboard será implementado em breve.");

}

function openReports() {

  SpreadsheetApp
    .getUi()
    .alert("Relatórios serão implementados em breve.");

}
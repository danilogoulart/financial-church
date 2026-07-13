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
 * Entradas de formulário (showMemberForm, showTransactionForm e
 * showPayableForm) ficam nos respectivos Controllers.
 *
 * Próximas implementações
 */

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
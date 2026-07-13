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
 * As entradas do menu são funções globais que vivem nos respectivos
 * Controllers (Member/Transaction/Payable/Dashboard/Report). O menu
 * apenas as referencia por nome.
 */
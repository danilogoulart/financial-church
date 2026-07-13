/**
 * Financial Church
 * Menu principal
 */

class Menu {

  static build() {

    SpreadsheetApp.getUi()

      .createMenu("🏛 Financial Church")

      .addItem("🚀 Instalar / Atualizar Estrutura", "install")

      .addItem("🌐 Link do Web App", "showWebAppUrl")

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
const Menu = {

  create() {

    SpreadsheetApp.getUi()

      .createMenu("Tesouraria")

      .addItem("Instalar Sistema", "install")

      .addSeparator()

      .addItem("Novo Membro", "showMember")

      .addItem("Nova Movimentação", "showTransaction")

      .addItem("Contas a Pagar", "showPayable")

      .addSeparator()

      .addItem("Dashboard", "openDashboard")

      .addToUi();

  }

};

function showMember() {}

function showTransaction() {}

function showPayable() {}

function openDashboard() {}
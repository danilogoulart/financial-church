/**
 * Financial Church
 * Installer
 */

class Installer {

  static run() {

    const ui = SpreadsheetApp.getUi();

    try {

      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Instalando Financial Church...",
        APP.NAME,
        3
      );

      this.createDashboard();
      this.createMembers();
      this.createTransactions();
      this.createPayables();
      this.createReports();
      this.createConfig();
      this.createSystem();

      ui.alert(
        APP.NAME,
        "Sistema instalado com sucesso!",
        ui.ButtonSet.OK
      );

    } catch (e) {

      ui.alert(
        "Erro",
        e.message,
        ui.ButtonSet.OK
      );

      throw e;

    }

  }

  static createDashboard() {

    const sheet = Database.recreateSheet(SHEETS.DASHBOARD);

    sheet.getRange("A1").setValue("FINANCIAL CHURCH");

    sheet.getRange("A2").setValue(APP.VERSION);

    sheet.getRange("A4").setValue("Saldo Atual");

    sheet.getRange("A7").setValue("Entradas");

    sheet.getRange("A10").setValue("Saídas");

    sheet.setColumnWidth(1, 220);

  }

  static createMembers() {

    const sheet = Database.recreateSheet(SHEETS.MEMBERS);

    Database.setHeader(
      sheet,
      HEADERS.MEMBERS
    );

  }

  static createTransactions() {

    const sheet = Database.recreateSheet(
      SHEETS.TRANSACTIONS
    );

    Database.setHeader(
      sheet,
      HEADERS.TRANSACTIONS
    );

  }

  static createPayables() {

    const sheet = Database.recreateSheet(
      SHEETS.PAYABLES
    );

    Database.setHeader(
      sheet,
      HEADERS.PAYABLES
    );

  }

  static createReports() {

    Database.recreateSheet(
      SHEETS.REPORTS
    );

  }

  static createConfig() {

    const sheet = Database.recreateSheet(
      SHEETS.CONFIG
    );

    sheet.getRange("A1").setValue("Receitas");

    sheet.getRange("A2:A5").setValues([
      ["Dízimos"],
      ["Ofertas"],
      ["Cantina"],
      ["Eventos"]
    ]);

    sheet.getRange("C1").setValue("Despesas");

    sheet.getRange("C2:C8").setValues([
      ["Conta de água"],
      ["Conta de luz"],
      ["Conta de internet"],
      ["Passagem de pregador"],
      ["Limpeza"],
      ["Descartáveis"],
      ["Parcela terreno"]
    ]);

    sheet.getRange("E1").setValue("Formas");

    sheet.getRange("E2:E3").setValues([
      ["Dinheiro"],
      ["PIX"]
    ]);

    sheet.getRange("G1").setValue("Cultos");

    sheet.getRange("G2:G5").setValues([
      ["Domingo Manhã"],
      ["Domingo Noite"],
      ["Quarta-feira"],
      ["Outro"]
    ]);

  }

  static createSystem() {

    const sheet = Database.recreateSheet(
      SHEETS.SYSTEM
    );

    sheet.appendRow([
      "CHAVE",
      "VALOR"
    ]);

    sheet.appendRow([
      SYSTEM.VERSION,
      APP.VERSION
    ]);

    sheet.appendRow([
      SYSTEM.INSTALLED_AT,
      new Date()
    ]);

    sheet.appendRow([
      SYSTEM.MEMBER_LAST_ID,
      0
    ]);

    sheet.appendRow([
      SYSTEM.TRANSACTION_LAST_ID,
      0
    ]);

    sheet.appendRow([
      SYSTEM.PAYABLE_LAST_ID,
      0
    ]);

    sheet.hideSheet();

  }

}
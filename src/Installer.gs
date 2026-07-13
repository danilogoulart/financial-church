class Installer {

  static run() {

    PropertiesService.getScriptProperties()
      .setProperty(PROPS.SPREADSHEET_ID, SpreadsheetApp.getActiveSpreadsheet().getId());

    this.createDashboard();
    this.createMembers();
    this.createTransactions();
    this.createPayables();
    this.createReports();
    this.createConfig();
    this.createSystem();

    SpreadsheetApp.flush();

    Logger.log("Financial Church instalado com sucesso.");

  }

  static createDashboard() {

    const sh = Database.recreateSheet(SHEETS.DASHBOARD);

    sh.getRange("A1").setValue("Financial Church");
    sh.getRange("A2").setValue(APP.VERSION);

  }

  static createMembers() {

    const sh = Database.recreateSheet(SHEETS.MEMBERS);

    Database.setHeader(sh, HEADERS.MEMBERS);

  }

  static createTransactions() {

    const sh = Database.recreateSheet(SHEETS.TRANSACTIONS);

    Database.setHeader(sh, HEADERS.TRANSACTIONS);

  }

  static createPayables() {

    const sh = Database.recreateSheet(SHEETS.PAYABLES);

    Database.setHeader(sh, HEADERS.PAYABLES);

  }

  static createReports() {

    Database.recreateSheet(SHEETS.REPORTS);

  }

  static createConfig() {

    const sh = Database.recreateSheet(SHEETS.CONFIG);

    sh.getRange("A1").setValue("Categorias Receita");
    sh.getRange("A2:A5").setValues([
      ["Dízimos"],
      ["Ofertas"],
      ["Cantina"],
      ["Eventos"]
    ]);

    sh.getRange("C1").setValue("Categorias Despesa");
    sh.getRange("C2:C8").setValues([
      ["Conta de água"],
      ["Conta de luz"],
      ["Conta de internet"],
      ["Passagem de pregador"],
      ["Limpeza"],
      ["Descartáveis"],
      ["Parcela terreno"]
    ]);

  }

  static createSystem() {

    const sh = Database.recreateSheet(SHEETS.SYSTEM);

    sh.appendRow(["KEY", "VALUE"]);

    sh.appendRow(["VERSION", APP.VERSION]);
    sh.appendRow(["MEMBER_LAST_ID", 0]);
    sh.appendRow(["TRANSACTION_LAST_ID", 0]);
    sh.appendRow(["PAYABLE_LAST_ID", 0]);

    sh.hideSheet();

  }

}
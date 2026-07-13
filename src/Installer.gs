const Installer = {

  run() {

    this.createSheets();

    SpreadsheetApp
      .getUi()
      .alert("Sistema instalado com sucesso.");

  },

  createSheets() {

    this.createDashboard();

    this.createMembers();

    this.createTransactions();

    this.createPayables();

    this.createReports();

    this.createConfig();

    this.createSystem();

  },

  createDashboard() {

    const sh = Database.createSheet(SHEETS.DASHBOARD);

    sh.clear();

    sh.getRange("A1").setValue("TESOURARIA");

  },

  createMembers() {

    this.createTable(
      SHEETS.MEMBERS,
      HEADERS.MEMBERS
    );

  },

  createTransactions() {

    this.createTable(
      SHEETS.TRANSACTIONS,
      HEADERS.TRANSACTIONS
    );

  },

  createPayables() {

    this.createTable(
      SHEETS.PAYABLES,
      HEADERS.PAYABLES
    );

  },

  createReports() {

    Database.createSheet(SHEETS.REPORTS);

  },

  createConfig() {

    Database.createSheet(SHEETS.CONFIG);

  },

  createSystem() {

    const sh = Database.createSheet(SHEETS.SYSTEM);

    sh.hideSheet();

    sh.clear();

    sh.appendRow(["KEY","VALUE"]);

    sh.appendRow([SYSTEM_KEYS.VERSION, APP.VERSION]);

    sh.appendRow([SYSTEM_KEYS.CREATED_AT, new Date()]);

    sh.appendRow([SYSTEM_KEYS.MEMBER_LAST_ID,0]);

    sh.appendRow([SYSTEM_KEYS.TRANSACTION_LAST_ID,0]);

    sh.appendRow([SYSTEM_KEYS.PAYABLE_LAST_ID,0]);

  },

  createTable(name, headers){

    const sh = Database.createSheet(name);

    sh.clear();

    sh.appendRow(headers);

    sh.setFrozenRows(1);

    sh.getRange(1,1,1,headers.length)
      .setFontWeight("bold")
      .setBackground("#1E88E5")
      .setFontColor("white");

    sh.getDataRange().createFilter();

  }

};
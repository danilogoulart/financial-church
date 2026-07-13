/**
 * Instalação idempotente: pode rodar quantas vezes quiser sem apagar
 * dados. Cria abas que faltam, garante cabeçalhos (migra colunas novas
 * como "Comprovante"), preenche Config só se vazia e garante as chaves
 * do SYSTEM sem resetar os contadores de ID.
 */
class Installer {

  static run() {

    PropertiesService.getScriptProperties()
      .setProperty(PROPS.SPREADSHEET_ID, SpreadsheetApp.getActiveSpreadsheet().getId());

    this.ensureDashboard();
    this.ensureDataSheet(SHEETS.MEMBERS, HEADERS.MEMBERS);
    this.ensureDataSheet(SHEETS.TRANSACTIONS, HEADERS.TRANSACTIONS);
    this.ensureDataSheet(SHEETS.PAYABLES, HEADERS.PAYABLES);
    this.ensureReports();
    this.ensureConfig();
    this.ensureSystem();

    SpreadsheetApp.flush();

    Logger.log("Financial Church: estrutura garantida com sucesso.");

  }

  static ensureDashboard() {

    const sh = Database.createSheet(SHEETS.DASHBOARD);

    if (sh.getRange("A1").getValue() === "") {
      sh.getRange("A1").setValue(APP.NAME);
      sh.getRange("A2").setValue(APP.VERSION);
    }

  }

  static ensureDataSheet(name, headers) {

    const sh = Database.createSheet(name);

    // Reaplicar o cabeçalho é seguro (escreve só a linha 1) e migra
    // colunas novas para abas já existentes.
    Database.setHeader(sh, headers);

  }

  static ensureReports() {

    Database.createSheet(SHEETS.REPORTS);

  }

  static ensureConfig() {

    const sh = Database.createSheet(SHEETS.CONFIG);

    // Cabeçalho da lista de e-mails com acesso aos comprovantes.
    if (sh.getRange("E1").getValue() === "") {
      sh.getRange("E1").setValue("Acesso Comprovantes (e-mails)");
    }

    // Não sobrescreve categorias que o usuário já ajustou.
    if (sh.getRange("A1").getValue() !== "") {
      return;
    }

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

  static ensureSystem() {

    const sh = Database.createSheet(SHEETS.SYSTEM);

    if (sh.getLastRow() === 0) {
      sh.appendRow(["KEY", "VALUE"]);
    }

    this.ensureSystemKey(sh, "VERSION", APP.VERSION);
    this.ensureSystemKey(sh, "MEMBER_LAST_ID", 0);
    this.ensureSystemKey(sh, "TRANSACTION_LAST_ID", 0);
    this.ensureSystemKey(sh, "PAYABLE_LAST_ID", 0);

    sh.hideSheet();

  }

  static ensureSystemKey(sheet, key, defaultValue) {

    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === key) {
        return; // já existe: preserva o valor atual (contadores!)
      }
    }

    sheet.appendRow([key, defaultValue]);

  }

}

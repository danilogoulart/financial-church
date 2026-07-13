/**
 * Camada única de acesso à planilha
 */

class Database {

  /**
   * Resolve a planilha tanto no contexto vinculado (menu/diálogo, onde
   * existe planilha ativa) quanto no Web App (onde não existe — usamos
   * o ID salvo em Script Properties). O ID é persistido sempre que há
   * planilha ativa, então basta rodar 'Instalar Sistema' uma vez.
   */
  static spreadsheet() {

    const props = PropertiesService.getScriptProperties();
    const active = SpreadsheetApp.getActiveSpreadsheet();

    if (active) {

      if (props.getProperty(PROPS.SPREADSHEET_ID) !== active.getId()) {
        props.setProperty(PROPS.SPREADSHEET_ID, active.getId());
      }

      return active;

    }

    const id = props.getProperty(PROPS.SPREADSHEET_ID);

    if (id) {
      return SpreadsheetApp.openById(id);
    }

    throw new Error(
      "Planilha não configurada. Abra a planilha e rode 'Instalar Sistema' uma vez."
    );

  }

  static sheet(name) {

    const sheet = this.spreadsheet().getSheetByName(name);

    if (!sheet) {
      throw new Error(`A aba '${name}' não existe.`);
    }

    return sheet;

  }

  static createSheet(name) {

    const ss = this.spreadsheet();

    let sheet = ss.getSheetByName(name);

    if (!sheet) {
      sheet = ss.insertSheet(name);
    }

    return sheet;

  }

  static recreateSheet(name) {

    const ss = this.spreadsheet();

    const old = ss.getSheetByName(name);

    if (old) {
      ss.deleteSheet(old);
    }

    return ss.insertSheet(name);

  }

  static setHeader(sheet, headers) {

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    sheet.getRange(1, 1, 1, headers.length)
      .setBackground(COLORS.HEADER)
      .setFontColor(COLORS.HEADER_FONT)
      .setFontWeight("bold");

    sheet.setFrozenRows(1);

    if (sheet.getFilter()) {
      sheet.getFilter().remove();
    }

    sheet.getRange(1, 1, 1, headers.length).createFilter();

  }

  static append(sheetName, values) {

    this.sheet(sheetName).appendRow(values);

  }

  static write(sheetName, row, column, values) {

    this.sheet(sheetName)
      .getRange(row, column, values.length, values[0].length)
      .setValues(values);

  }

  static lastRow(sheetName) {

    return this.sheet(sheetName).getLastRow();

  }

  static values(sheetName) {

    return this.sheet(sheetName).getDataRange().getValues();

  }

}
/**
 * Camada única de acesso à planilha
 */

class Database {

  static spreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
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
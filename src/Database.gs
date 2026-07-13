const Database = {

  spreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  sheet(name) {
    return this.spreadsheet().getSheetByName(name);
  },

  createSheet(name) {

    let sheet = this.sheet(name);

    if (sheet) return sheet;

    return this.spreadsheet().insertSheet(name);

  },

  clear(sheet) {

    sheet.clear();

    return sheet;

  },

  append(sheetName, values) {

    const sheet = this.sheet(sheetName);

    sheet.appendRow(values);

  },

  lastRow(sheetName) {

    return this.sheet(sheetName).getLastRow();

  }

};
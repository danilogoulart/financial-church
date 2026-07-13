/**
 * Gera relatórios na aba Relatórios a partir das movimentações.
 */
class ReportService {

  static generate() {

    const transactions = TransactionRepository.findAll();

    const sheet = Database.createSheet(SHEETS.REPORTS);
    sheet.clear();

    sheet.getRange("A1").setValue(APP.NAME + " — Relatórios").setFontSize(16).setFontWeight("bold");
    sheet.getRange("A2")
      .setValue("Gerado em " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"))
      .setFontColor("#666666");

    let row = this.renderByCompetency(sheet, transactions, 4);
    row = this.renderByCategory(sheet, transactions, row + 2);

    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidths(2, 3, 140);

    SpreadsheetApp.flush();

  }

  static renderByCompetency(sheet, transactions, start) {

    const map = {};

    transactions.forEach(t => {

      const competency = t[2] || "(sem competência)";
      const type = t[4];
      const amount = Number(t[8]) || 0;

      if (!map[competency]) {
        map[competency] = { income: 0, expense: 0 };
      }

      if (type === "Receita") {
        map[competency].income += amount;
      } else if (type === "Despesa") {
        map[competency].expense += amount;
      }

    });

    this.writeTableHeader(sheet, start, ["Competência", "Receitas", "Despesas", "Saldo"]);

    const competencies = Object.keys(map).sort();

    if (competencies.length === 0) {
      sheet.getRange(start + 1, 1).setValue("Sem lançamentos").setFontColor("#999999");
      return start + 1;
    }

    const rows = competencies.map(competency => {
      const item = map[competency];
      return [competency, item.income, item.expense, item.income - item.expense];
    });

    sheet.getRange(start + 1, 1, rows.length, 4).setValues(rows);
    sheet.getRange(start + 1, 2, rows.length, 3).setNumberFormat(FORMATS.CURRENCY);

    return start + rows.length;

  }

  static renderByCategory(sheet, transactions, start) {

    const map = {};

    transactions.forEach(t => {

      const type = t[4] || "(sem tipo)";
      const category = t[5] || "(sem categoria)";
      const amount = Number(t[8]) || 0;
      const key = type + " • " + category;

      if (!map[key]) {
        map[key] = { type, category, total: 0 };
      }

      map[key].total += amount;

    });

    this.writeTableHeader(sheet, start, ["Tipo", "Categoria", "Total"]);

    const keys = Object.keys(map);

    if (keys.length === 0) {
      sheet.getRange(start + 1, 1).setValue("Sem lançamentos").setFontColor("#999999");
      return start + 1;
    }

    const rows = keys
      .map(key => map[key])
      .sort((a, b) => (a.type + a.category).localeCompare(b.type + b.category))
      .map(item => [item.type, item.category, item.total]);

    sheet.getRange(start + 1, 1, rows.length, 3).setValues(rows);
    sheet.getRange(start + 1, 3, rows.length, 1).setNumberFormat(FORMATS.CURRENCY);

    return start + rows.length;

  }

  static writeTableHeader(sheet, row, headers) {

    sheet.getRange(row, 1, 1, headers.length)
      .setValues([headers])
      .setBackground(COLORS.HEADER)
      .setFontColor(COLORS.HEADER_FONT)
      .setFontWeight("bold");

  }

}

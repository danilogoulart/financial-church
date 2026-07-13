/**
 * Monta a aba Dashboard a partir das movimentações e contas a pagar.
 */
class DashboardService {

  static refresh() {

    const totals = this.summarize();

    const sheet = Database.createSheet(SHEETS.DASHBOARD);
    sheet.clear();

    this.renderHeader(sheet);
    let row = this.renderKpis(sheet, totals);
    row = this.renderPayables(sheet, totals, row + 1);
    row = this.renderCategories(sheet, "Receitas por categoria", totals.incomeByCategory, row + 1);
    row = this.renderCategories(sheet, "Despesas por categoria", totals.expenseByCategory, row + 1);

    sheet.setColumnWidth(1, 260);
    sheet.setColumnWidth(2, 160);

    SpreadsheetApp.flush();

    return totals;

  }

  static summarize() {

    const transactions = TransactionRepository.findAll();
    const payables = PayableRepository.findAll();

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach(row => {

      const type = row[4];
      const category = row[5] || "(sem categoria)";
      const amount = Number(row[8]) || 0;

      if (type === "Receita") {
        totalIncome += amount;
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      } else if (type === "Despesa") {
        totalExpense += amount;
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
      }

    });

    let payableOpen = 0;
    let payableOpenCount = 0;
    let payablePaid = 0;

    payables.forEach(row => {

      const amount = Number(row[3]) || 0;
      const status = row[6];

      if (status === "Pago") {
        payablePaid += amount;
      } else {
        payableOpen += amount;
        payableOpenCount++;
      }

    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory,
      payableOpen,
      payableOpenCount,
      payablePaid
    };

  }

  static renderHeader(sheet) {

    sheet.getRange("A1").setValue(APP.NAME + " — Dashboard").setFontSize(16).setFontWeight("bold");
    sheet.getRange("A2")
      .setValue("Atualizado em " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"))
      .setFontColor("#666666");

  }

  static renderKpis(sheet, totals) {

    const start = 4;

    const rows = [
      ["Total de Receitas", totals.totalIncome],
      ["Total de Despesas", totals.totalExpense],
      ["Saldo", totals.balance]
    ];

    sheet.getRange(start, 1, rows.length, 2).setValues(rows);
    sheet.getRange(start, 1, rows.length, 1).setFontWeight("bold");
    sheet.getRange(start, 2, rows.length, 1).setNumberFormat(FORMATS.CURRENCY);

    sheet.getRange(start, 1, 1, 2).setBackground("#E8F5E9");
    sheet.getRange(start + 1, 1, 1, 2).setBackground("#FFEBEE");
    sheet.getRange(start + 2, 1, 1, 2)
      .setBackground(totals.balance >= 0 ? "#E3F2FD" : "#FFF3E0")
      .setFontWeight("bold");

    return start + rows.length - 1;

  }

  static renderPayables(sheet, totals, start) {

    sheet.getRange(start, 1).setValue("Contas a Pagar").setFontWeight("bold").setFontColor(COLORS.HEADER);

    const rows = [
      ["Em aberto (" + totals.payableOpenCount + ")", totals.payableOpen],
      ["Pagas", totals.payablePaid]
    ];

    sheet.getRange(start + 1, 1, rows.length, 2).setValues(rows);
    sheet.getRange(start + 1, 2, rows.length, 1).setNumberFormat(FORMATS.CURRENCY);

    return start + rows.length;

  }

  static renderCategories(sheet, title, map, start) {

    sheet.getRange(start, 1).setValue(title).setFontWeight("bold").setFontColor(COLORS.HEADER);

    const entries = Object.keys(map).map(key => [key, map[key]]);

    if (entries.length === 0) {
      sheet.getRange(start + 1, 1).setValue("Sem lançamentos").setFontColor("#999999");
      return start + 1;
    }

    entries.sort((a, b) => b[1] - a[1]);

    sheet.getRange(start + 1, 1, entries.length, 2).setValues(entries);
    sheet.getRange(start + 1, 2, entries.length, 1).setNumberFormat(FORMATS.CURRENCY);

    return start + entries.length;

  }

}

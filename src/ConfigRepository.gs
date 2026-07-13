/**
 * Leitura das configurações (categorias) da aba Config
 */
class ConfigRepository {

  static categories() {

    const values = Database.values(SHEETS.CONFIG);

    const income = [];
    const expense = [];

    for (let i = 1; i < values.length; i++) {

      const incomeCategory = values[i][0];
      const expenseCategory = values[i][2];

      if (incomeCategory && String(incomeCategory).trim() !== "") {
        income.push(incomeCategory);
      }

      if (expenseCategory && String(expenseCategory).trim() !== "") {
        expense.push(expenseCategory);
      }

    }

    return { income, expense };

  }

  static incomeCategories() {
    return this.categories().income;
  }

  static expenseCategories() {
    return this.categories().expense;
  }

}

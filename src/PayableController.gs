function showPayableForm() {

  const html = HtmlService
    .createHtmlOutputFromFile("Payable")
    .setWidth(500)
    .setHeight(560);

  SpreadsheetApp.getUi()
    .showModalDialog(html, "Nova Conta a Pagar");

}

function savePayable(data) {

  return PayableService.create(data);

}

function listPayableCategories() {

  return ConfigRepository.expenseCategories();

}

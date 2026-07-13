function showTransactionForm() {

  const html = HtmlService
    .createHtmlOutputFromFile("Transaction")
    .setWidth(650)
    .setHeight(650);

  SpreadsheetApp.getUi()
    .showModalDialog(html, "Nova Movimentação");

}

function saveTransaction(data) {

  return TransactionService.create(data);

}

function listMembers() {

  return MemberRepository.listForSelect();

}

function listCategories() {

  return ConfigRepository.categories();

}
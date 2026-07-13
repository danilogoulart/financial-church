function saveTransaction(data) {

  return TransactionService.create(data);

}

function listMembers() {

  return MemberRepository.listForSelect();

}

function listCategories() {

  return ConfigRepository.categories();

}
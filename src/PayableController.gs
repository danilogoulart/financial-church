function savePayable(data) {

  return PayableService.create(data);

}

function listPayableCategories() {

  return ConfigRepository.expenseCategories();

}

class PayableRepository {

  static save(payable) {

    Database.append(SHEETS.PAYABLES, [
      payable.id,
      payable.description,
      payable.category,
      payable.amount,
      payable.dueDate,
      payable.paymentDate,
      payable.status,
      payable.createdAt,
      payable.updatedAt
    ]);

  }

  static findAll() {

    const values = Database.values(SHEETS.PAYABLES);

    values.shift();

    return values;

  }

}

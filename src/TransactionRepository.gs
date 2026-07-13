class TransactionRepository {

  static save(transaction) {

    Database.append(
      SHEETS.TRANSACTIONS,
      [
        transaction.id,
        transaction.date,
        transaction.competency,
        transaction.memberId,
        transaction.type,
        transaction.category,
        transaction.cult,
        transaction.paymentMethod,
        transaction.amount,
        transaction.observation,
        transaction.createdAt,
        transaction.updatedAt
      ]
    );

  }

}
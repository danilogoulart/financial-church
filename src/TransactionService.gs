class TransactionService {

  static create(data) {

    if (!data.memberId) {
      throw new Error("Selecione um membro.");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new Error("Valor inválido.");
    }

    const trx = {

      id: IdService.nextTransactionId(),

      date: data.date,

      competency: data.competency,

      memberId: data.memberId,

      type: data.type,

      category: data.category,

      cult: data.cult,

      paymentMethod: data.paymentMethod,

      amount: Number(data.amount),

      observation: data.observation,

      createdAt: new Date(),

      updatedAt: new Date()

    };

    TransactionRepository.save(trx);

    return trx;

  }

}
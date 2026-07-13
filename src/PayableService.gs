class PayableService {

  static create(data) {

    if (!data.description || data.description.trim() === "") {
      throw new Error("Descrição é obrigatória.");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new Error("Valor inválido.");
    }

    if (!data.dueDate) {
      throw new Error("Vencimento é obrigatório.");
    }

    const now = new Date();

    const hasPayment = data.paymentDate && String(data.paymentDate).trim() !== "";

    const receiptUrl = DriveService.saveReceipt(data.attachment);

    const payable = {

      id: IdService.nextPayableId(),

      description: data.description.trim(),

      category: data.category || "",

      amount: Number(data.amount),

      dueDate: data.dueDate,

      paymentDate: hasPayment ? data.paymentDate : "",

      status: hasPayment ? "Pago" : "Em aberto",

      receiptUrl: receiptUrl,

      createdAt: now,

      updatedAt: now

    };

    PayableRepository.save(payable);

    return payable;

  }

}

/**
 * Geração de IDs do sistema
 */
class IdService {

  static nextMemberId() {
    return this.next("MEMBER_LAST_ID", "MEM");
  }

  static nextTransactionId() {
    return this.next("TRANSACTION_LAST_ID", "TRX");
  }

  static nextPayableId() {
    return this.next("PAYABLE_LAST_ID", "PAY");
  }

  static next(systemKey, prefix) {

    const sheet = Database.sheet(SHEETS.SYSTEM);

    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {

      if (values[i][0] === systemKey) {

        const next = Number(values[i][1]) + 1;

        sheet.getRange(i + 1, 2).setValue(next);

        return `${prefix}-${String(next).padStart(6, "0")}`;

      }

    }

    throw new Error(`Chave ${systemKey} não encontrada.`);

  }

}
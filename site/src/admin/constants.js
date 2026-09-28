// Formas de pagamento (lista fixa). PIX primeiro (padrão), Dinheiro segundo.
export const PAYMENT_METHODS = [
  'PIX', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência', 'Cheque'
]

// Formas que representam DINHEIRO em espécie (o resto conta como conta bancária).
export const CASH_METHODS = ['Dinheiro']
export const isCashMethod = (m) => CASH_METHODS.includes(m)

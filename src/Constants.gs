const APP = Object.freeze({
  NAME: 'Financial Church',
  VERSION: '0.1.0'
});

const SHEETS = Object.freeze({
  DASHBOARD: 'Dashboard',
  MEMBERS: 'Membros',
  TRANSACTIONS: 'Movimentações',
  PAYABLES: 'ContasPagar',
  REPORTS: 'Relatórios',
  CONFIG: 'Config',
  SYSTEM: '_SYSTEM'
});

const SYSTEM_KEYS = Object.freeze({
  VERSION: 'VERSION',
  CREATED_AT: 'CREATED_AT',
  MEMBER_LAST_ID: 'MEMBER_LAST_ID',
  TRANSACTION_LAST_ID: 'TRANSACTION_LAST_ID',
  PAYABLE_LAST_ID: 'PAYABLE_LAST_ID'
});

const HEADERS = Object.freeze({

  MEMBERS: [
    'ID',
    'Nome',
    'Telefone',
    'Família',
    'Ministério',
    'É Dizimista',
    'Ativo',
    'Criado Em'
  ],

  TRANSACTIONS: [
    'ID',
    'Data',
    'Competência',
    'MemberID',
    'Tipo',
    'Categoria',
    'Culto',
    'Forma',
    'Valor',
    'Observação',
    'Criado Em'
  ],

  PAYABLES: [
    'ID',
    'Descrição',
    'Categoria',
    'Valor',
    'Vencimento',
    'Pagamento',
    'Situação',
    'Criado Em'
  ]

});
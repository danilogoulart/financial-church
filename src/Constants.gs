/**
 * Financial Church
 * Constants
 */

const APP = Object.freeze({
  NAME: 'Financial Church',
  VERSION: '1.0.0'
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

const COLORS = Object.freeze({
  HEADER: '#1E88E5',
  HEADER_FONT: '#FFFFFF'
});

const FORMATS = Object.freeze({
  CURRENCY: 'R$ #,##0.00'
});

const PROPS = Object.freeze({
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  RECEIPTS_FOLDER_ID: 'RECEIPTS_FOLDER_ID'
});

const HEADERS = Object.freeze({

  MEMBERS: [
    'ID',
    'Nome',
    'Telefone',
    'Família',
    'Ministério',
    'Dizimista',
    'Ativo',
    'Criado em',
    'Atualizado em'
  ],

  TRANSACTIONS: [
    'ID',
    'Data',
    'Competência',
    'Membro',
    'Tipo',
    'Categoria',
    'Culto',
    'Forma',
    'Valor',
    'Observação',
    'Criado em',
    'Atualizado em',
    'Comprovante'
  ],

  PAYABLES: [
    'ID',
    'Descrição',
    'Categoria',
    'Valor',
    'Vencimento',
    'Pagamento',
    'Situação',
    'Criado em',
    'Atualizado em',
    'Comprovante'
  ]

});

const SYSTEM = Object.freeze({
  VERSION: 'VERSION',
  MEMBER_LAST_ID: 'MEMBER_LAST_ID',
  TRANSACTION_LAST_ID: 'TRANSACTION_LAST_ID',
  PAYABLE_LAST_ID: 'PAYABLE_LAST_ID',
  INSTALLED_AT: 'INSTALLED_AT'
});
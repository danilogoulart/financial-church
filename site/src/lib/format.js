export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : ''

export const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { dateStyle: 'long' }) : ''

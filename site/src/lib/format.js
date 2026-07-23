// Horário fixado no fuso do Brasil (na Vercel o servidor roda em UTC).
export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo'
      })
    : ''

// fmtDate recebe uma data pura 'YYYY-MM-DD' (sem horário) — não aplicar fuso
// aqui, senão o dia "volta" para o anterior.
export const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { dateStyle: 'long' }) : ''

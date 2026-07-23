export default function Pagination({ page, size, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (total <= size) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
      <button className="link-btn" disabled={page <= 0} onClick={() => onPage(page - 1)}>
        ← anterior
      </button>
      <small>Página {page + 1} de {pages} · {total} registros</small>
      <button className="link-btn" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        próxima →
      </button>
    </div>
  )
}

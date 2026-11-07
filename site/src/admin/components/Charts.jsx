// Gráficos em SVG (sem dependência). Paleta categórica validada (dataviz).
export const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
const INK = '#333'
const MUTED = '#898781'
const SURFACE = '#fff'

const fmtMoney = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (v) => (v * 100).toFixed(1).replace('.', ',') + '%'

// Dobra categorias além de `max` em "Outros" (mantém a paleta curta e legível).
function fold(data, max = 6) {
  if (data.length <= max) return data
  const head = data.slice(0, max - 1)
  const rest = data.slice(max - 1).reduce((s, d) => s + d.value, 0)
  return [...head, { label: 'Outros', value: rest }]
}

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

// Rosca com rótulos diretos na legenda (identidade não depende só da cor).
export function Donut({ data, mode = 'valores' }) {
  const items = fold((data || []).filter((d) => d.value > 0).sort((a, b) => b.value - a.value))
  const total = items.reduce((s, d) => s + d.value, 0)
  if (!total) return <div style={{ color: MUTED, fontSize: 13 }}>Sem dados no período.</div>
  const cx = 90, cy = 90, r = 70, sw = 34
  let a = -Math.PI / 2
  const gap = 0.03
  const segs = items.map((d, i) => {
    const frac = d.value / total
    const a0 = a + gap / 2
    const a1 = a + frac * 2 * Math.PI - gap / 2
    a += frac * 2 * Math.PI
    return { d, i, path: arc(cx, cy, r, a0, Math.max(a1, a0 + 0.001)) }
  })
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" width="180" height="180" role="img">
        {segs.map((s) => (
          <path key={s.i} d={s.path} fill="none" stroke={PALETTE[s.i % PALETTE.length]} strokeWidth={sw} />
        ))}
      </svg>
      <div style={{ flex: 1, minWidth: 200 }}>
        {items.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '2px 0' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length], flex: '0 0 auto' }} />
            <span style={{ flex: 1 }}>{d.label}</span>
            <b style={{ fontVariantNumeric: 'tabular-nums' }}>
              {mode === 'percentuais' ? fmtPct(d.value / total) : fmtMoney(d.value)}
            </b>
          </div>
        ))}
      </div>
    </div>
  )
}

// Barras horizontais. format: 'money' | 'pct' | 'count'. Mantém ordem recebida se keepOrder.
export function BarsH({ data, mode = 'valores', color = PALETTE[0], format, keepOrder = false }) {
  let items = (data || []).filter((d) => d.value > 0)
  if (!keepOrder) items = items.sort((a, b) => b.value - a.value)
  const total = items.reduce((s, d) => s + d.value, 0)
  const max = Math.max(1, ...items.map((d) => d.value))
  if (!items.length) return <div style={{ color: MUTED, fontSize: 13 }}>Sem dados no período.</div>
  const fmt = format || (mode === 'percentuais' ? 'pct' : 'money')
  const show = (v) => (fmt === 'count' ? v : fmt === 'pct' ? fmtPct(total ? v / total : 0) : fmtMoney(v))
  return (
    <div>
      {items.map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: 8, alignItems: 'center', fontSize: 13, padding: '3px 0' }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
          <div style={{ background: '#eee', borderRadius: 4, height: 14 }}>
            <div style={{ width: `${(d.value / max) * 100}%`, background: color, height: 14, borderRadius: 4, minWidth: 2 }} />
          </div>
          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{show(d.value)}</b>
        </div>
      ))}
    </div>
  )
}

// Barras agrupadas Receitas x Despesas por mês.
export function MonthBars({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{ color: MUTED, fontSize: 13 }}>Sem dados.</div>
  const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.expense)))
  const W = Math.max(320, rows.length * 48)
  const H = 160, pad = 24, bw = 8
  const x = (i) => pad + i * ((W - pad * 2) / rows.length) + ((W - pad * 2) / rows.length) / 2
  const y = (v) => H - pad - (v / max) * (H - pad * 2)
  const green = PALETTE[2], red = PALETTE[7]
  const mLabel = (m) => { const [, mm] = m.split('-'); return ['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(mm)] }
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, marginBottom: 6 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: green, borderRadius: 2, marginRight: 4 }} />Receitas</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: red, borderRadius: 2, marginRight: 4 }} />Despesas</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#c3c2b7" strokeWidth="1" />
        {rows.map((r, i) => (
          <g key={i}>
            <rect x={x(i) - bw - 1} y={y(r.income)} width={bw} height={H - pad - y(r.income)} fill={green} rx="2" />
            <rect x={x(i) + 1} y={y(r.expense)} width={bw} height={H - pad - y(r.expense)} fill={red} rx="2" />
            <text x={x(i)} y={H - pad + 12} textAnchor="middle" fontSize="10" fill={MUTED}>{mLabel(r.month)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Barras agrupadas genéricas por mês. series=[{key,label,color}].
export function SeriesBars({ data, series }) {
  const rows = data || []
  if (!rows.length) return <div style={{ color: MUTED, fontSize: 13 }}>Sem dados.</div>
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => Number(r[s.key]) || 0)))
  const W = Math.max(320, rows.length * (series.length * 10 + 28))
  const H = 160, pad = 24, bw = 8
  const slot = (W - pad * 2) / rows.length
  const x = (i) => pad + i * slot + slot / 2
  const y = (v) => H - pad - (v / max) * (H - pad * 2)
  const mLabel = (m) => { const [, mm] = String(m).split('-'); return ['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(mm)] }
  const groupW = series.length * (bw + 2)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, marginBottom: 6 }}>
        {series.map((s) => (
          <span key={s.key}><span style={{ display: 'inline-block', width: 10, height: 10, background: s.color, borderRadius: 2, marginRight: 4 }} />{s.label}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#c3c2b7" strokeWidth="1" />
        {rows.map((r, i) => (
          <g key={i}>
            {series.map((s, j) => {
              const v = Number(r[s.key]) || 0
              return <rect key={s.key} x={x(i) - groupW / 2 + j * (bw + 2)} y={y(v)} width={bw} height={H - pad - y(v)} fill={s.color} rx="2" />
            })}
            <text x={x(i)} y={H - pad + 12} textAnchor="middle" fontSize="10" fill={MUTED}>{mLabel(r.month)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Anel de porcentagem (ex.: % de dizimistas).
export function Gauge({ pct, label }) {
  const cx = 70, cy = 70, r = 56, sw = 16
  const circ = 2 * Math.PI * r
  const val = Math.max(0, Math.min(1, pct || 0))
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <svg viewBox="0 0 140 140" width="140" height="140" role="img">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eee" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={PALETTE[2]} strokeWidth={sw}
          strokeDasharray={`${circ * val} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="26" fontWeight="bold" fill={INK}>{fmtPct(val)}</text>
      </svg>
      {label && <div style={{ fontSize: 14, color: INK, maxWidth: 160 }}>{label}</div>}
    </div>
  )
}

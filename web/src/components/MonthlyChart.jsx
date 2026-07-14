import { formatMoney, monthLabel } from '../api'

const INCOME = '#1B9E5A'
const EXPENSE = '#D64545'

// Barras agrupadas: Receitas x Despesas por mês.
export default function MonthlyChart({ data }) {
  const W = 640
  const H = 280
  const padL = 64
  const padR = 12
  const padT = 16
  const padB = 30

  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const baseY = padT + plotH

  const max = Math.max(0, ...data.flatMap((d) => [d.income, d.expense]))
  const top = niceMax(max)

  const y = (v) => baseY - (v / top) * plotH
  const groupW = plotW / Math.max(data.length, 1)
  const barW = Math.min(28, groupW * 0.3)
  const gap = 2

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f)

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13 }}>
        <Legend color={INCOME} label="Receitas" />
        <Legend color={EXPENSE} label="Despesas" />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
        {/* grade + rótulos do eixo Y */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#eee" strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#888">
              {compact(t)}
            </text>
          </g>
        ))}

        {/* barras */}
        {data.map((d, i) => {
          const gx = padL + i * groupW + groupW / 2
          const x1 = gx - barW - gap / 2
          const x2 = gx + gap / 2
          return (
            <g key={d.month}>
              <rect x={x1} y={y(d.income)} width={barW} height={baseY - y(d.income)} rx="4" fill={INCOME}>
                <title>{`${monthLabel(d.month)} — Receitas: ${formatMoney(d.income)}`}</title>
              </rect>
              <rect x={x2} y={y(d.expense)} width={barW} height={baseY - y(d.expense)} rx="4" fill={EXPENSE}>
                <title>{`${monthLabel(d.month)} — Despesas: ${formatMoney(d.expense)}`}</title>
              </rect>
              <text x={gx} y={baseY + 18} textAnchor="middle" fontSize="11" fill="#555">
                {monthLabel(d.month)}
              </text>
            </g>
          )
        })}

        <line x1={padL} x2={W - padR} y1={baseY} y2={baseY} stroke="#ccc" strokeWidth="1" />
      </svg>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function niceMax(v) {
  if (v <= 0) return 1
  const exp = Math.floor(Math.log10(v))
  const base = Math.pow(10, exp)
  const f = v / base
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nf * base
}

function compact(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', {
    notation: 'compact',
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 1
  })
}

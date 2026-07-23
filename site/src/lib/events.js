// Recorrência de eventos. Um evento tem starts_at (1ª ocorrência: data+hora),
// recurrence ('none'|'daily'|'weekly'|'monthly') e repeat_until (último dia).

const CAP = { daily: 31, weekly: 53, monthly: 24 }

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// N-ésima ocorrência de um dia da semana no mês (ex.: 1º domingo). null se não existir.
function nthWeekdayOfMonth(year, month, weekday, nth) {
  const first = new Date(year, month, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  const day = 1 + offset + (nth - 1) * 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  if (day > daysInMonth) return null
  return new Date(year, month, day)
}

// Todas as ocorrências (datas) do evento, em ordem cronológica.
export function occurrences(ev) {
  if (!ev?.starts_at) return []
  const start = new Date(ev.starts_at)
  const rec = ev.recurrence || 'none'
  if (rec === 'none') return [start]

  const until = ev.repeat_until ? new Date(ev.repeat_until + 'T23:59:59') : null
  const cap = CAP[rec] || 12
  const out = []

  if (rec === 'daily') {
    let d = new Date(start)
    while (out.length < cap) {
      if (until && d > until) break
      out.push(new Date(d))
      if (!until) break // congresso sem "último dia" definido = um dia só
      d.setDate(d.getDate() + 1)
    }
    return out
  }

  if (rec === 'weekly') {
    let d = new Date(start)
    while (out.length < cap) {
      if (until && d > until) break
      out.push(new Date(d))
      d.setDate(d.getDate() + 7)
    }
    return out
  }

  // monthly — por dia do mês ('day') ou por dia da semana ('weekday', ex.: 1º domingo)
  const byWeekday = (ev.monthly_by || 'day') === 'weekday'
  const weekday = start.getDay()
  const nth = Math.floor((start.getDate() - 1) / 7) + 1
  let y = start.getFullYear()
  let m = start.getMonth()
  while (out.length < cap) {
    let occ
    if (byWeekday) {
      occ = nthWeekdayOfMonth(y, m, weekday, nth)
    } else {
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      occ = new Date(y, m, Math.min(start.getDate(), daysInMonth))
    }
    if (occ) {
      occ.setHours(start.getHours(), start.getMinutes(), 0, 0)
      if (until && occ > until) break
      out.push(occ)
    }
    m++
    if (m > 11) { m = 0; y++ }
  }
  return out
}

// Próxima ocorrência de hoje em diante (ou null se já passou tudo).
export function nextOccurrence(ev) {
  const today = startOfDay(new Date())
  for (const d of occurrences(ev)) {
    if (startOfDay(d) >= today) return d
  }
  return null
}

// Ocorrências futuras (hoje em diante).
export function upcomingOccurrences(ev) {
  const today = startOfDay(new Date())
  return occurrences(ev).filter((d) => startOfDay(d) >= today)
}

function fmtTime(d) {
  const h = d.getHours()
  const m = d.getMinutes()
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

function dayRange(a, b) {
  const dA = a.getDate()
  const dB = b.getDate()
  const mA = a.toLocaleDateString('pt-BR', { month: 'long' })
  const mB = b.toLocaleDateString('pt-BR', { month: 'long' })
  if (dA === dB && mA === mB) return `${dA} de ${mA}`
  if (mA === mB) return `${dA} a ${dB} de ${mA}`
  return `${dA} de ${mA} a ${dB} de ${mB}`
}

function untilLabel(ev) {
  if (!ev.repeat_until) return ''
  const u = new Date(ev.repeat_until + 'T00:00:00')
  return ` · até ${u.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

// Texto amigável do padrão do evento (para cards e página).
export function scheduleLabel(ev) {
  if (!ev?.starts_at) return ''
  const start = new Date(ev.starts_at)
  const rec = ev.recurrence || 'none'
  const time = fmtTime(start)

  if (rec === 'none') {
    const date = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    return `${date} · ${time}`
  }
  if (rec === 'daily') {
    const occ = occurrences(ev)
    return `${dayRange(occ[0], occ[occ.length - 1])} · ${time}`
  }
  if (rec === 'weekly') {
    const wd = start.toLocaleDateString('pt-BR', { weekday: 'long' })
    return `Toda ${wd} · ${time}${untilLabel(ev)}`
  }
  if (rec === 'monthly') {
    if ((ev.monthly_by || 'day') === 'weekday') {
      const weekday = start.toLocaleDateString('pt-BR', { weekday: 'long' })
      const nth = Math.floor((start.getDate() - 1) / 7) + 1
      const ord = ['1º', '2º', '3º', '4º', '5º'][nth - 1] || `${nth}º`
      return `Todo ${ord} ${weekday} · ${time}${untilLabel(ev)}`
    }
    return `Todo dia ${start.getDate()} · ${time}${untilLabel(ev)}`
  }
  return ''
}

export function fmtOccurrence(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) +
    ` · ${fmtTime(d)}`
}

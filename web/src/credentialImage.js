import { APP_NAME, CHURCH_ADDRESS, CHURCH_FULL_NAME } from './brand'

const W = 380
const H = 404

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—')

function validity() {
  const now = new Date()
  const until = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const f = (dt) =>
    `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
  return { issued: f(now), until: f(until) }
}

function clip(s, max) {
  s = String(s ?? '')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function wrap(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) cur = (cur + ' ' + w).trim()
    else {
      if (cur) lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] += '…'
  }
  return lines
}

function centered(cx, y, lineHeight, lines, attrs) {
  return `<text x="${cx}" y="${y}" text-anchor="middle" ${attrs}>${lines
    .map((ln, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : lineHeight}">${esc(ln)}</tspan>`)
    .join('')}</text>`
}

async function toDataUrl(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const kv = (x, y, label, value, max = 24) =>
  `<text x="${x}" y="${y}" font-size="11"><tspan fill="#666">${esc(label)} </tspan><tspan fill="#111">${esc(clip(value || '—', max))}</tspan></text>`

function sigGroup(cx, dataUrl, name, role, y = 292) {
  const img = dataUrl
    ? `<image x="${cx - 50}" y="${y}" width="100" height="34" href="${dataUrl}" preserveAspectRatio="xMidYMid meet"/>`
    : ''
  return `
    ${img}
    <line x1="${cx - 74}" y1="${y + 38}" x2="${cx + 74}" y2="${y + 38}" stroke="#222"/>
    <text x="${cx}" y="${y + 52}" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">${esc(clip(name || '—', 26))}</text>
    <text x="${cx}" y="${y + 64}" text-anchor="middle" font-size="10" fill="#666">${role}</text>`
}

function buildSvg({ member, settings, logo, photo, presSig, secSig }) {
  const registro = member.matricula || String(member.id || '').slice(0, 8).toUpperCase()
  const desde = fmtDate(member.joined_date || member.created_at)
  const { issued, until } = validity()

  const photoEl = photo
    ? `<image x="14" y="70" width="84" height="108" href="${photo}" preserveAspectRatio="xMidYMid slice"/>
       <rect x="14" y="70" width="84" height="108" rx="6" fill="none" stroke="#ccc"/>`
    : `<rect x="14" y="70" width="84" height="108" rx="6" fill="#f0f0f0" stroke="#ccc"/>
       <text x="56" y="128" text-anchor="middle" font-size="11" fill="#aaa">sem foto</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif">
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="#fff" stroke="#222"/>
    <path d="M0 12 A12 12 0 0 1 12 0 H368 A12 12 0 0 1 380 12 V48 H0 Z" fill="#000"/>
    ${logo ? `<image x="14" y="12" width="40" height="26" href="${logo}" preserveAspectRatio="xMidYMid meet"/>` : ''}
    <text x="68" y="26" font-size="15" font-weight="bold" fill="#fff">${esc(APP_NAME)}</text>
    <text x="68" y="40" font-size="10" fill="#fff">Credencial</text>

    <rect x="0" y="48" width="190" height="6" fill="#009c3b"/>
    <rect x="190" y="48" width="190" height="6" fill="#ffdf00"/>

    ${photoEl}

    <text x="112" y="88" font-size="15" font-weight="bold" fill="#111">${esc(clip(member.name, 28))}</text>
    ${kv(112, 108, 'Cargo:', member.cargo, 28)}
    ${kv(112, 126, 'Matrícula:', registro, 18)}
    ${kv(112, 144, 'Membro desde:', desde, 16)}
    ${kv(112, 162, 'RG:', member.rg, 18)}
    ${kv(112, 180, 'CPF:', member.cpf, 18)}
    ${kv(112, 198, 'Nascimento:', fmtDate(member.birth_date), 14)}

    <text x="14" y="232" font-size="11" font-weight="bold" fill="#111">Emitida em ${issued} · Válida até ${until}</text>
    <text x="14" y="248" font-size="10" font-style="italic" fill="#666">Válida em todo o território nacional.</text>

    ${sigGroup(104, presSig, settings.president_name, 'Presidente', 274)}
    ${sigGroup(276, secSig, settings.secretary_name, 'Secretário(a)', 274)}

    ${centered(190, 362, 11, wrap(CHURCH_FULL_NAME, 52, 2), 'font-size="10" font-weight="bold" fill="#333"')}
    ${centered(190, 388, 10, wrap(CHURCH_ADDRESS, 70, 2), 'font-size="9" fill="#666"')}
  </svg>`
}

export async function downloadCredentialPng({ member, settings, logoUrl, photoUrl, presSigUrl, secSigUrl }) {
  const [logo, photo, presSig, secSig] = await Promise.all([
    toDataUrl(logoUrl),
    toDataUrl(photoUrl),
    toDataUrl(presSigUrl),
    toDataUrl(secSigUrl)
  ])

  const svg = buildSvg({ member, settings: settings || {}, logo, photo, presSig, secSig })
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

  await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 3
      const canvas = document.createElement('canvas')
      canvas.width = W * scale
      canvas.height = H * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `credencial-${String(member.name || '').replace(/\s+/g, '_')}.png`
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    }
    img.onerror = reject
    img.src = svgUrl
  })
}

import { APP_NAME } from './brand'

const W = 420
const H = 360

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

const kv = (x, y, label, value) =>
  `<text x="${x}" y="${y}" font-size="11"><tspan fill="#666">${esc(label)} </tspan><tspan fill="#111" font-weight="bold">${esc(clip(value || '—', 22))}</tspan></text>`

function sigGroup(cx, dataUrl, name, role) {
  const img = dataUrl
    ? `<image x="${cx - 50}" y="290" width="100" height="30" href="${dataUrl}" preserveAspectRatio="xMidYMid meet"/>`
    : ''
  return `
    ${img}
    <line x1="${cx - 72}" y1="322" x2="${cx + 72}" y2="322" stroke="#222"/>
    <text x="${cx}" y="336" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">${esc(clip(name || '—', 26))}</text>
    <text x="${cx}" y="348" text-anchor="middle" font-size="10" fill="#666">${role}</text>`
}

function buildSvg({ member, settings, logo, photo, presSig, secSig, title }) {
  const ministries = clip((member.ministries || []).join(', ') || '—', 40)
  const registro = member.matricula || String(member.id || '').slice(0, 8).toUpperCase()
  const desde = fmtDate(member.joined_date || member.created_at)
  const { issued, until } = validity()

  const photoEl = photo
    ? `<image x="14" y="66" width="88" height="112" href="${photo}" preserveAspectRatio="xMidYMid slice"/>
       <rect x="14" y="66" width="88" height="112" rx="6" fill="none" stroke="#ccc"/>`
    : `<rect x="14" y="66" width="88" height="112" rx="6" fill="#f0f0f0" stroke="#ccc"/>
       <text x="58" y="124" text-anchor="middle" font-size="11" fill="#aaa">sem foto</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif">
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="#fff" stroke="#222"/>
    <path d="M0 12 A12 12 0 0 1 12 0 H408 A12 12 0 0 1 420 12 V48 H0 Z" fill="#10105a"/>
    ${logo ? `<image x="14" y="11" width="40" height="26" href="${logo}" preserveAspectRatio="xMidYMid meet"/>` : ''}
    <text x="62" y="26" font-size="14" font-weight="bold" fill="#fff">${esc(APP_NAME)}</text>
    <text x="62" y="40" font-size="10" fill="#cfd3d9">${esc(title)}</text>

    <rect x="0" y="48" width="210" height="7" fill="#009c3b"/>
    <rect x="210" y="48" width="210" height="7" fill="#ffdf00"/>

    ${photoEl}

    <text x="116" y="88" font-size="15" font-weight="bold" fill="#111">${esc(clip(member.name, 28))}</text>
    ${kv(116, 108, 'Cargo:', member.cargo)}
    ${kv(116, 126, 'Ministérios:', ministries)}

    ${kv(14, 202, 'Matrícula:', registro)}
    ${kv(220, 202, 'Membro desde:', desde)}
    ${kv(14, 220, 'RG:', member.rg)}
    ${kv(220, 220, 'CPF:', member.cpf)}
    ${kv(14, 238, 'Nascimento:', fmtDate(member.birth_date))}

    <text x="14" y="260" font-size="11" font-weight="bold" fill="#111">Emitida em ${issued} · Válida até ${until}</text>
    <text x="14" y="276" font-size="9" font-style="italic" fill="#666">Válida em todo o território nacional, acompanhada da carta de recomendação.</text>

    ${sigGroup(120, presSig, settings.president_name, 'Presidente')}
    ${sigGroup(300, secSig, settings.secretary_name, 'Secretário(a)')}
  </svg>`
}

export async function downloadCredentialPng({ member, settings, logoUrl, photoUrl, presSigUrl, secSigUrl, title }) {
  const [logo, photo, presSig, secSig] = await Promise.all([
    toDataUrl(logoUrl),
    toDataUrl(photoUrl),
    toDataUrl(presSigUrl),
    toDataUrl(secSigUrl)
  ])

  const svg = buildSvg({ member, settings: settings || {}, logo, photo, presSig, secSig, title })
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

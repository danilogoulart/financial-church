import { APP_NAME } from './brand'

const W = 380
const H = 240

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

// Busca uma imagem (mesma origem ou URL assinada) e devolve como data URI,
// para embutir no SVG sem tainting de canvas / problema de CORS.
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

function clip(s, max) {
  s = String(s ?? '')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function sigGroup(cx, dataUrl, name, role) {
  const img = dataUrl
    ? `<image x="${cx - 45}" y="163" width="90" height="32" href="${dataUrl}" preserveAspectRatio="xMidYMid meet"/>`
    : ''
  return `
    ${img}
    <line x1="${cx - 70}" y1="198" x2="${cx + 70}" y2="198" stroke="#222"/>
    <text x="${cx}" y="212" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">${esc(clip(name || '—', 26))}</text>
    <text x="${cx}" y="224" text-anchor="middle" font-size="10" fill="#666">${role}</text>`
}

function buildSvg({ member, settings, logo, photo, presSig, secSig, title }) {
  const ministries = clip((member.ministries || []).join(', ') || '—', 34)
  const registro = String(member.id || '').slice(0, 8).toUpperCase()
  const desde = member.created_at
    ? member.created_at.slice(0, 10).split('-').reverse().join('/')
    : ''

  const photoEl = photo
    ? `<image x="14" y="58" width="84" height="108" href="${photo}" preserveAspectRatio="xMidYMid slice"/>
       <rect x="14" y="58" width="84" height="108" rx="6" fill="none" stroke="#ccc"/>`
    : `<rect x="14" y="58" width="84" height="108" rx="6" fill="#f0f0f0" stroke="#ccc"/>
       <text x="56" y="116" text-anchor="middle" font-size="11" fill="#aaa">sem foto</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif">
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="#fff" stroke="#222"/>
    <path d="M0 12 A12 12 0 0 1 12 0 H368 A12 12 0 0 1 380 12 V44 H0 Z" fill="#000"/>
    ${logo ? `<image x="14" y="10" width="36" height="24" href="${logo}" preserveAspectRatio="xMidYMid meet"/>` : ''}
    <text x="58" y="23" font-size="14" font-weight="bold" fill="#fff">${esc(APP_NAME)}</text>
    <text x="58" y="37" font-size="10" fill="#cfd3d9">${esc(title)}</text>

    ${photoEl}

    <text x="110" y="76" font-size="15" font-weight="bold" fill="#111">${esc(clip(member.name, 26))}</text>
    <text x="110" y="100" font-size="12" fill="#111">Cargo: ${esc(member.cargo || '—')}</text>
    <text x="110" y="118" font-size="12" fill="#111">Ministérios: ${esc(ministries)}</text>
    <text x="110" y="136" font-size="12" fill="#111">Registro: ${registro}</text>
    <text x="110" y="154" font-size="12" fill="#111">Membro desde: ${desde}</text>

    ${sigGroup(110, presSig, settings.president_name, 'Presidente')}
    ${sigGroup(285, secSig, settings.secretary_name, 'Secretário(a)')}
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

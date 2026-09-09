// Utilidades de imagem/compartilhamento do QR Pix (rodam no navegador).

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function whatsappShareUrl({ url, name = 'Igreja AD Alpha', key } = {}) {
  const lines = [`Contribua com a *${name}* via Pix 🙏`, '']
  if (key) lines.push(`Chave Pix: ${key}`)
  if (url) lines.push(`Acesse: ${url}`)
  return 'https://wa.me/?text=' + encodeURIComponent(lines.join('\n'))
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Escreve texto centralizado com quebra automática; retorna o próximo y.
function drawWrapped(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight))
  return y + lines.length * lineHeight
}

// Monta um card (retrato) com logo, título, QR e instruções. Retorna PNG dataURL.
export async function composePixCard({
  qrDataUrl,
  logoUrl,
  title = 'Contribua via Pix',
  subtitle = '',
  instructions = 'Abra o app do seu banco, escolha Pix → Ler QR Code e aponte a câmera.',
  keyLabel = '',
  footer = ''
} = {}) {
  const W = 1080
  const H = 1500
  const pad = 56
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fundo escuro + cartão branco (combina com a identidade prata/preto).
  ctx.fillStyle = '#0f0f10'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 44)
  ctx.fill()

  const cx = W / 2
  const inner = W - pad * 2 - 90
  let y = pad + 96

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl)
      // Faixa preta atrás da logo (a logo prata foi feita para fundo escuro).
      const bandH = 200
      ctx.save()
      roundRect(ctx, pad, pad, W - pad * 2, bandH, 44)
      ctx.clip()
      ctx.fillStyle = '#0f0f10'
      ctx.fillRect(pad, pad, W - pad * 2, bandH)
      const lw = 240
      const lh = logo.height * (lw / logo.width)
      ctx.drawImage(logo, cx - lw / 2, pad + (bandH - lh) / 2, lw, lh)
      ctx.restore()
      y = pad + bandH + 78
    } catch {
      /* segue sem logo */
    }
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 66px Georgia, "Times New Roman", serif'
  ctx.fillText(title, cx, y)
  y += 66

  if (subtitle) {
    ctx.fillStyle = '#555555'
    ctx.font = '32px Arial, sans-serif'
    y = drawWrapped(ctx, subtitle, cx, y, inner, 42) + 16
  }

  const qr = await loadImage(qrDataUrl)
  const qs = 680
  ctx.drawImage(qr, cx - qs / 2, y, qs, qs)
  y += qs + 46

  ctx.fillStyle = '#333333'
  ctx.font = '32px Arial, sans-serif'
  y = drawWrapped(ctx, instructions, cx, y, inner, 44) + 22

  if (keyLabel) {
    ctx.fillStyle = '#111111'
    ctx.font = 'bold 36px Arial, sans-serif'
    y = drawWrapped(ctx, keyLabel, cx, y, inner, 46)
  }

  if (footer) {
    ctx.fillStyle = '#888888'
    ctx.font = '28px Arial, sans-serif'
    ctx.fillText(footer, cx, H - pad - 48)
  }

  return canvas.toDataURL('image/png')
}

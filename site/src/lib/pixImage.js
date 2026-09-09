// Utilidades de imagem/compartilhamento do QR Pix (rodam no navegador).

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function whatsappShareUrl({ url, name = 'Igreja AD Alpha', key, payload } = {}) {
  const lines = [`Contribua com a *${name}* via Pix`]
  if (key) lines.push('', `Chave Pix: ${key}`)
  if (payload) lines.push('', 'Pix Copia e Cola:', payload)
  if (url) lines.push('', `Ou acesse: ${url}`)
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

// Card simples (fundo branco): apenas o QR, as instruções e a chave/CNPJ.
export async function composePixCard({
  qrDataUrl,
  instructions = 'Abra o app do seu banco, escolha Pix → Ler QR Code e aponte a câmera.',
  keyLabel = ''
} = {}) {
  const W = 1000
  const pad = 60
  const qs = W - pad * 2 // QR ocupa a largura útil
  const inner = W - pad * 2

  // Mede o texto para calcular a altura final (canvas de medição).
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = '34px Arial, sans-serif'
  const instrLines = wrapCount(measure, instructions, inner)

  let H = pad + qs + 40 + instrLines * 46
  if (keyLabel) H += 30 + 46
  H += pad

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2
  let y = pad

  const qr = await loadImage(qrDataUrl)
  ctx.drawImage(qr, cx - qs / 2, y, qs, qs)
  y += qs + 56

  ctx.textAlign = 'center'
  ctx.fillStyle = '#333333'
  ctx.font = '34px Arial, sans-serif'
  y = drawWrapped(ctx, instructions, cx, y, inner, 46)

  if (keyLabel) {
    y += 30
    ctx.fillStyle = '#111111'
    ctx.font = 'bold 40px Arial, sans-serif'
    ctx.fillText(keyLabel, cx, y)
  }

  return canvas.toDataURL('image/png')
}

// Conta quantas linhas o texto ocupa em maxWidth (para dimensionar o canvas).
function wrapCount(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/)
  let line = ''
  let n = 1
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      n++
      line = w
    } else {
      line = test
    }
  }
  return n
}

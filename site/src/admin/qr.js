import QRCode from 'qrcode'

// URL pública que valida a credencial (aponta para /validar/:id no site).
export function credentialUrl(memberId) {
  return `${window.location.origin}/validar/${memberId}`
}

// Data URL (PNG) do QR code que leva à validação da credencial.
export async function credentialQr(memberId) {
  if (!memberId) return null
  try {
    return await QRCode.toDataURL(credentialUrl(memberId), {
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M'
    })
  } catch {
    return null
  }
}

// QR em alta definição a partir de um texto qualquer (ex.: BR Code Pix).
export async function hiResQr(text, width = 1024) {
  if (!text) return null
  try {
    return await QRCode.toDataURL(text, { margin: 2, width, errorCorrectionLevel: 'M' })
  } catch {
    return null
  }
}

// QR de presença: carrega um token (regenerável). Ao ler e logar, o app
// identifica o culto em andamento pela agenda (dia/horário) e registra.
export function checkinUrl(token) {
  return `${window.location.origin}/admin?checkin=${token}`
}

// Data URL (PNG) do QR de presença — a secretaria imprime/projeta.
export async function attendanceQr(token, width = 640) {
  if (!token) return null
  try {
    return await QRCode.toDataURL(checkinUrl(token), {
      margin: 1,
      width,
      errorCorrectionLevel: 'M'
    })
  } catch {
    return null
  }
}

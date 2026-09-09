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

// QR FIXO de presença: sempre o mesmo. Ao ler e logar, o app identifica o culto
// em andamento pela agenda (dia/horário) e registra a presença.
export function checkinUrl() {
  return `${window.location.origin}/admin?checkin=aberto`
}

// Data URL (PNG) do QR fixo de presença — a secretaria imprime/projeta uma vez.
export async function attendanceQr(width = 640) {
  try {
    return await QRCode.toDataURL(checkinUrl(), {
      margin: 1,
      width,
      errorCorrectionLevel: 'M'
    })
  } catch {
    return null
  }
}

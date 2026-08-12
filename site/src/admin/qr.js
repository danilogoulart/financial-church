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

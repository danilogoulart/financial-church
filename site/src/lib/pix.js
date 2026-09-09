// Gera o BR Code Pix (payload EMV estático) — o "Pix Copia e Cola".
// Segue o Manual de Padrões para Iniciação do Pix (Banco Central / EMVCo).
// Estático: reutilizável, com ou sem valor definido.

// Campo TLV: id (2) + tamanho (2) + valor.
function tlv(id, value) {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

// Remove acentos e caracteres fora de ASCII imprimível; corta no tamanho máx.
function sanitize(s, max) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, max)
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido no fim do payload.
function crc16(payload) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Monta o payload Pix estático. `key` é a chave Pix (CNPJ/e-mail/telefone/aleatória).
export function buildPixPayload({ key, name, city, txid = '***', amount, description } = {}) {
  if (!key) return ''

  const gui = tlv('00', 'br.gov.bcb.pix')
  const chave = tlv('01', String(key).trim())
  const desc = description ? tlv('02', sanitize(description, 40)) : ''
  const merchantAccount = tlv('26', gui + chave + desc)

  const merchantName = sanitize(name, 25) || 'RECEBEDOR'
  const merchantCity = sanitize(city, 15) || 'BRASIL'
  const txidClean = sanitize(txid, 25) || '***'
  const amt = amount != null && amount !== '' && Number(amount) > 0
    ? Number(amount).toFixed(2)
    : null

  let payload =
    tlv('00', '01') +               // Payload Format Indicator
    merchantAccount +               // Merchant Account Information (Pix)
    tlv('52', '0000') +             // Merchant Category Code
    tlv('53', '986') +              // Moeda: BRL
    (amt ? tlv('54', amt) : '') +   // Valor (opcional)
    tlv('58', 'BR') +               // País
    tlv('59', merchantName) +       // Nome do recebedor
    tlv('60', merchantCity) +       // Cidade
    tlv('62', tlv('05', txidClean)) // Additional data: reference label (txid)

  payload += '6304' // id + tamanho do CRC
  return payload + crc16(payload)
}

import { useState } from 'react'
import { receiptDownloadUrl, receiptShareUrl, receiptUrl } from '../api'

// Acesso ao comprovante: ver, baixar e gerar link de 7 dias.
export default function ReceiptLink({ path }) {
  const [busy, setBusy] = useState('')

  if (!path) return <span>—</span>

  async function run(kind) {
    setBusy(kind)
    try {
      if (kind === 'ver') {
        window.open(await receiptUrl(path), '_blank', 'noopener')
      } else if (kind === 'baixar') {
        window.open(await receiptDownloadUrl(path), '_blank', 'noopener')
      } else if (kind === 'link') {
        const url = await receiptShareUrl(path)
        await navigator.clipboard.writeText(url)
        alert('Link copiado (válido por 7 dias).')
      }
    } catch (err) {
      alert('Não foi possível acessar o comprovante: ' + err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <button className="link-btn" onClick={() => run('ver')} disabled={!!busy}>ver</button>
      {' · '}
      <button className="link-btn" onClick={() => run('baixar')} disabled={!!busy}>baixar</button>
      {' · '}
      <button className="link-btn" onClick={() => run('link')} disabled={!!busy}>link</button>
    </span>
  )
}

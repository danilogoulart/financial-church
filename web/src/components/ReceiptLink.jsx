import { useState } from 'react'
import { receiptUrl } from '../api'

// Gera uma URL assinada sob demanda (expira em 1h) e abre em nova aba.
export default function ReceiptLink({ path }) {
  const [loading, setLoading] = useState(false)

  if (!path) return <span>—</span>

  async function open() {
    setLoading(true)
    try {
      const url = await receiptUrl(path)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      alert('Não foi possível abrir o comprovante: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <a
      className="link"
      href="#"
      onClick={(e) => {
        e.preventDefault()
        open()
      }}
    >
      {loading ? 'abrindo...' : 'ver'}
    </a>
  )
}

import { useEffect, useRef, useState } from 'react'
import { recordAttendance } from './api'

// Tela de registro de presença. Aberta quando o membro escaneia o QR do culto
// (/admin?checkin=<id>) e está logado. Registra a presença via RPC.
export default function CheckIn({ sessionId, onDone }) {
  const [state, setState] = useState('loading') // loading | ok | error
  const [msg, setMsg] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    recordAttendance(sessionId)
      .then(() => setState('ok'))
      .catch((e) => {
        setState('error')
        setMsg(e.message)
      })
  }, [sessionId])

  return (
    <div className="center">
      <div className="card login" style={{ textAlign: 'center' }}>
        {state === 'loading' && <p style={{ color: 'var(--muted)' }}>Registrando presença...</p>}
        {state === 'ok' && (
          <>
            <div style={{ fontSize: 48, lineHeight: 1 }}>✓</div>
            <h1>Presença registrada</h1>
            <p style={{ color: 'var(--muted)' }}>Sua presença neste culto foi registrada. Deus abençoe!</p>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ fontSize: 48, lineHeight: 1 }}>⚠️</div>
            <h1>Não foi possível registrar</h1>
            <p style={{ color: 'var(--muted)' }}>{msg}</p>
          </>
        )}
        {state !== 'loading' && (
          <button className="primary" style={{ marginTop: 16 }} onClick={onDone}>
            Ir para o painel
          </button>
        )}
      </div>
    </div>
  )
}

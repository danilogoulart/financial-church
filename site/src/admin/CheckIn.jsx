import { useEffect, useRef, useState } from 'react'
import { recordAttendance, recordAttendanceOpen } from './api'

const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '')

// Tela de registro de presença. Aberta quando o membro escaneia o QR fixo
// (/admin?checkin=aberto) e está logado — o app identifica o culto do momento.
export default function CheckIn({ sessionId, onDone }) {
  const [state, setState] = useState('loading') // loading | ok | error
  const [msg, setMsg] = useState('')
  const [cult, setCult] = useState(null)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    // 'aberto' = QR fixo (culto pela agenda); UUID = QR antigo de sessão específica.
    const p = sessionId === 'aberto' ? recordAttendanceOpen() : recordAttendance(sessionId)
    Promise.resolve(p)
      .then((r) => {
        if (r && r.cult) setCult(`${r.cult} — ${fmtDate(r.session_date)}`)
        setState('ok')
      })
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
            {cult && <p style={{ fontWeight: 'bold', margin: '4px 0' }}>{cult}</p>}
            <p style={{ color: 'var(--muted)' }}>Sua presença foi registrada. Deus abençoe!</p>
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

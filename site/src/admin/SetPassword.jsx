import { useState } from 'react'
import { updatePassword } from './auth'
import { APP_NAME, LOGO_URL } from './brand'

// Mostrada após o usuário abrir o link de redefinição (evento PASSWORD_RECOVERY).
export default function SetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 6) {
      setMsg({ type: 'err', text: 'A senha deve ter ao menos 6 caracteres.' })
      return
    }
    if (password !== confirm) {
      setMsg({ type: 'err', text: 'As senhas não conferem.' })
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      onDone()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <img
          className="logo-lg"
          src={LOGO_URL}
          alt={APP_NAME}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h1>Definir nova senha</h1>
        {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

        <label>Nova senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <label>Confirmar senha</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

        <button className="primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  )
}

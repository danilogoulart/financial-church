import { useState } from 'react'
import { supabase } from './supabaseClient'
import { APP_NAME, LOGO_URL } from './brand'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  async function signIn(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg({ type: 'err', text: 'E-mail ou senha inválidos.' })
    setLoading(false)
  }

  async function sendReset(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setMsg({ type: 'err', text: error.message })
    else setMsg({ type: 'ok', text: 'Se o e-mail existir, enviamos um link para redefinir a senha. Verifique a caixa de entrada e o spam.' })
    setLoading(false)
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={mode === 'login' ? signIn : sendReset}>
        <img
          className="logo-lg"
          src={LOGO_URL}
          alt={APP_NAME}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h1>{APP_NAME}</h1>
        {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {mode === 'login' && (
          <>
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        )}

        <button className="primary" disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Enviar link de redefinição'}
        </button>

        <button
          type="button"
          className="link-btn"
          style={{ marginTop: 12 }}
          onClick={() => {
            setMsg(null)
            setMode(mode === 'login' ? 'forgot' : 'login')
          }}
        >
          {mode === 'login' ? 'Esqueci a senha' : 'Voltar ao login'}
        </button>
      </form>
    </div>
  )
}

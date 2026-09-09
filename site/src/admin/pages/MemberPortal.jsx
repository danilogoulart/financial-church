import { useEffect, useRef, useState } from 'react'
import {
  assetUrl,
  changeEmail,
  changeMyPassword,
  formatMoney,
  getMyMember,
  getSettings,
  myContributions,
  updateMyProfile
} from '../api'
import { printCredential } from '../credentialPrint'
import { credentialCardHtml, CREDENTIAL_CSS } from '../credential'
import { credentialQr } from '../qr'

// Prévia isolada (shadow DOM) da credencial no mesmo layout do PDF.
function CredentialPreview({ data }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !data) return
    const host = ref.current
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${CREDENTIAL_CSS}</style>${credentialCardHtml(data)}`
  }, [data])
  return <div ref={ref} style={{ maxWidth: 380, margin: '4px auto 0' }} />
}

async function buildCredentialData(m) {
  const settings = await getSettings()
  const [photoUrl, presSigUrl, secSigUrl] = await Promise.all([
    assetUrl(m.photo_path),
    assetUrl(settings.president_sig),
    assetUrl(settings.secretary_sig)
  ])
  return {
    member: m,
    settings,
    logoUrl: window.location.origin + '/logo.png',
    photoUrl,
    presSigUrl,
    secSigUrl,
    qr: await credentialQr(m.id)
  }
}

// ---------- Minha credencial ----------

export function MyCredential() {
  const [banner, setBanner] = useState(null)
  const [member, setMember] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    getMyMember()
      .then((m) => {
        setMember(m)
        if (m && m.cargo !== 'Congregado') {
          buildCredentialData(m).then(setData).catch((e) => setBanner({ type: 'err', msg: e.message }))
        }
      })
      .catch(() => {})
  }, [])

  const isCongregado = member?.cargo === 'Congregado'

  return (
    <div className="card">
      <h2>Minha credencial</h2>
      {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}
      {isCongregado ? (
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Seu cargo (Congregado) não possui credencial.
        </p>
      ) : (
        <>
          <CredentialPreview data={data} />
          <button
            className="primary"
            style={{ marginTop: 14 }}
            disabled={!data}
            onClick={() => data && printCredential(data)}
          >
            {data ? 'Gerar PDF' : 'Preparando...'}
          </button>
        </>
      )}
    </div>
  )
}

// ---------- Minhas contribuições ----------

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
const fmtDay = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

export function MyContributions() {
  const [rows, setRows] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')

  useEffect(() => {
    myContributions().then(setRows).catch((e) => setError(e.message))
  }, [])

  // Agrupa por mês de referência (competency; se não houver, usa o mês da data).
  const byMonth = {}
  ;(rows || []).forEach((t) => {
    const ref = t.competency || (t.date || '').slice(0, 7)
    const [ry, rm] = ref.split('-').map(Number)
    if (ry !== year) return
    const b = (byMonth[rm] = byMonth[rm] || { total: 0, dates: [] })
    b.total += Number(t.amount) || 0
    if (t.date) b.dates.push(t.date)
  })
  const yearTotal = Object.values(byMonth).reduce((s, b) => s + b.total, 0)
  const nowY = new Date().getFullYear()
  const years = [nowY, nowY - 1, nowY - 2]

  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Minhas contribuições</h2>
        <div>
          <label>Ano</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <small>Por mês de referência — a que mês cada contribuição se refere.</small>
      {error && <div className="banner err" style={{ marginTop: 10 }}>{error}</div>}
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Mês de referência</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_NAMES.map((name, idx) => {
              const b = byMonth[idx + 1]
              const dates = b ? [...new Set(b.dates)].sort() : []
              const dateLabel =
                dates.length === 0 ? '—'
                : dates.length === 1 ? fmtDay(dates[0])
                : `${fmtDay(dates[dates.length - 1])} (+${dates.length - 1})`
              return (
                <tr key={idx} style={{ opacity: b ? 1 : 0.55 }}>
                  <td>{name} {year}</td>
                  <td style={{ textAlign: 'right' }}>{b ? formatMoney(b.total) : '—'}</td>
                  <td>{dateLabel}</td>
                </tr>
              )
            })}
            <tr className="tot">
              <td style={{ fontWeight: 'bold' }}>Total {year}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(yearTotal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- Meus dados ----------

export function MyProfile() {
  const [member, setMember] = useState(null)
  const [phone, setPhone] = useState('')
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  // E-mail e senha (seções próprias).
  const [email, setEmail] = useState('')
  const [emailBanner, setEmailBanner] = useState(null)
  const [emailSaving, setEmailSaving] = useState(false)
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [passBanner, setPassBanner] = useState(null)
  const [passSaving, setPassSaving] = useState(false)

  async function load() {
    try {
      const m = await getMyMember()
      setMember(m)
      if (m) {
        setPhone(m.phone || '')
        setEmail(m.email || '')
      }
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function savePhone(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      await updateMyProfile({ phone })
      setBanner({ type: 'ok', msg: 'Telefone atualizado.' })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function saveEmail(e) {
    e.preventDefault()
    setEmailSaving(true)
    setEmailBanner(null)
    try {
      await changeEmail(email.trim())
      setEmailBanner({ type: 'ok', msg: 'E-mail de acesso atualizado. Use o novo e-mail no próximo login.' })
      load()
    } catch (err) {
      setEmailBanner({ type: 'err', msg: err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  async function savePass(e) {
    e.preventDefault()
    if (pass.length < 6) {
      setPassBanner({ type: 'err', msg: 'A senha precisa ter ao menos 6 caracteres.' })
      return
    }
    if (pass !== pass2) {
      setPassBanner({ type: 'err', msg: 'As senhas não conferem.' })
      return
    }
    setPassSaving(true)
    setPassBanner(null)
    try {
      await changeMyPassword(pass)
      setPass('')
      setPass2('')
      setPassBanner({ type: 'ok', msg: 'Senha alterada.' })
    } catch (err) {
      setPassBanner({ type: 'err', msg: err.message })
    } finally {
      setPassSaving(false)
    }
  }

  if (!member) {
    return (
      <div className="card">
        <h2>Meus dados</h2>
        {banner ? <div className={`banner ${banner.type}`}>{banner.msg}</div> : <span style={{ color: '#999' }}>Carregando...</span>}
      </div>
    )
  }

  return (
    <>
      <form className="card" onSubmit={savePhone}>
        <h2>Meus dados</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <div style={{ fontSize: 14, lineHeight: 1.9 }}>
          <div>Nome: <b>{member.name}</b></div>
          <div>Família: <b>{member.family || '—'}</b></div>
          <div>Cargo: <b>{member.cargo || '—'}</b></div>
          <div>Ministérios: <b>{(member.ministries || []).join(', ') || '—'}</b></div>
        </div>
        <small>Esses dados são mantidos pela secretaria.</small>

        <label style={{ marginTop: 12 }}>Telefone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <button className="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar telefone'}</button>
      </form>

      <form className="card" onSubmit={saveEmail}>
        <h2>E-mail de acesso</h2>
        <small>Ao alterar, o e-mail de login também muda.</small>
        {emailBanner && <div className={`banner ${emailBanner.type}`} style={{ marginTop: 10 }}>{emailBanner.msg}</div>}
        <label style={{ marginTop: 10 }}>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="primary" disabled={emailSaving}>{emailSaving ? 'Alterando...' : 'Alterar e-mail'}</button>
      </form>

      <form className="card" onSubmit={savePass}>
        <h2>Senha</h2>
        {passBanner && <div className={`banner ${passBanner.type}`} style={{ marginTop: 10 }}>{passBanner.msg}</div>}
        <label style={{ marginTop: 10 }}>Nova senha</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        <label>Confirmar nova senha</label>
        <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
        <button className="primary" disabled={passSaving}>{passSaving ? 'Alterando...' : 'Alterar senha'}</button>
      </form>
    </>
  )
}

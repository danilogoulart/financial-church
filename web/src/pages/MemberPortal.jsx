import { useEffect, useRef, useState } from 'react'
import {
  assetUrl,
  formatMoney,
  getMyMember,
  getSettings,
  myContributions,
  updateMyProfile,
  uploadAsset,
  workerCargoNames
} from '../api'
import { printCredential } from '../credentialPrint'
import { downloadCredentialPng } from '../credentialImage'

// ---------- Minha credencial ----------

export function MyCredential() {
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)

  async function build() {
    const [member, settings, workers] = await Promise.all([
      getMyMember(),
      getSettings(),
      workerCargoNames()
    ])
    if (!member) throw new Error('Seu cadastro de membro não foi encontrado.')
    const [photoUrl, presSigUrl, secSigUrl] = await Promise.all([
      assetUrl(member.photo_path),
      assetUrl(settings.president_sig),
      assetUrl(settings.secretary_sig)
    ])
    return {
      member,
      settings,
      logoUrl: window.location.origin + '/logo.png',
      photoUrl,
      presSigUrl,
      secSigUrl,
      title: workers.includes(member.cargo) ? 'Credencial de Obreiro' : 'Credencial de Membro'
    }
  }

  async function run(fn) {
    setBanner(null)
    setBusy(true)
    try {
      await fn(await build())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h2>Minha credencial</h2>
      {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}
      <button className="primary" disabled={busy} onClick={() => run((d) => printCredential(d))}>
        {busy ? '...' : 'Gerar PDF'}
      </button>
      <button className="link-btn" style={{ marginTop: 10 }} disabled={busy} onClick={() => run((d) => downloadCredentialPng(d))}>
        Baixar PNG
      </button>
    </div>
  )
}

// ---------- Minhas contribuições ----------

export function MyContributions() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    myContributions().then(setRows).catch((e) => setError(e.message))
  }, [])

  const total = (rows || []).reduce((s, t) => s + (Number(t.amount) || 0), 0)

  return (
    <div className="card">
      <h2>Minhas contribuições</h2>
      {error && <div className="banner err">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.type}</td>
                <td>{t.category || '—'}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(t.amount)}</td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr><td colSpan="4" style={{ color: '#999' }}>Nenhuma contribuição registrada.</td></tr>
            )}
            {rows && rows.length > 0 && (
              <tr className="tot">
                <td colSpan="3" style={{ fontWeight: 'bold' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(total)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- Meus dados ----------

export function MyProfile() {
  const [member, setMember] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', family: '' })
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const photoRef = useRef(null)

  async function load() {
    try {
      const m = await getMyMember()
      setMember(m)
      if (m) setForm({ name: m.name || '', phone: m.phone || '', family: m.family || '' })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const file = photoRef.current?.files?.[0]
      const fields = { name: form.name.trim(), phone: form.phone, family: form.family }
      if (file) fields.photo_path = await uploadAsset(file, 'members/')
      await updateMyProfile(fields)
      setBanner({ type: 'ok', msg: 'Dados atualizados.' })
      if (photoRef.current) photoRef.current.value = ''
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
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
    <form className="card" onSubmit={save}>
      <h2>Meus dados</h2>
      {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

      <label>Nome</label>
      <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />

      <label>Telefone</label>
      <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

      <label>Família</label>
      <input value={form.family} onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))} />

      <label>Foto <small>(envie para substituir)</small></label>
      <input ref={photoRef} type="file" accept="image/*" />

      <div style={{ margin: '10px 0', fontSize: 13, color: 'var(--muted)' }}>
        Cargo: <b>{member.cargo || '—'}</b> · Ministérios: <b>{(member.ministries || []).join(', ') || '—'}</b>
        <br /><small>(cargo e ministérios são definidos pela secretaria)</small>
      </div>

      <button className="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
    </form>
  )
}

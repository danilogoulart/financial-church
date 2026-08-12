import { useEffect, useRef, useState } from 'react'
import {
  assetUrl,
  formatMoney,
  getMyMember,
  getSettings,
  myContributions,
  updateMyProfile,
  uploadAsset
} from '../api'
import { printCredential } from '../credentialPrint'
import { downloadCredentialPng } from '../credentialImage'
import { credentialQr } from '../qr'

// ---------- Minha credencial ----------

export function MyCredential() {
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)
  const [member, setMember] = useState(null)

  useEffect(() => {
    getMyMember().then(setMember).catch(() => {})
  }, [])

  async function build() {
    const [m, settings] = await Promise.all([getMyMember(), getSettings()])
    if (!m) throw new Error('Seu cadastro de membro não foi encontrado.')
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
          <button className="primary" disabled={busy} onClick={() => run((d) => printCredential(d))}>
            {busy ? '...' : 'Gerar PDF'}
          </button>
          <button className="link-btn" style={{ marginTop: 10 }} disabled={busy} onClick={() => run((d) => downloadCredentialPng(d))}>
            Baixar PNG
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

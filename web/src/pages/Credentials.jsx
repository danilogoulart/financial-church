import { useEffect, useState } from 'react'
import { assetUrl, getSettings, listMembersPage } from '../api'
import Pagination from '../components/Pagination.jsx'
import { printCredential } from '../credentialPrint'
import { downloadCredentialPng } from '../credentialImage'

const SIZE = 20
const logoUrl = () => window.location.origin + '/logo.png'

export default function Credentials() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [settings, setSettings] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    getSettings().then(setSettings).catch((e) => setBanner({ type: 'err', msg: e.message }))
  }, [])

  async function load() {
    try {
      const { rows, total } = await listMembersPage(page, SIZE, { search, activeOnly: true })
      setRows(rows)
      setTotal(total)
      
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function buildData(member) {
    const [photoUrl, presSigUrl, secSigUrl] = await Promise.all([
      assetUrl(member.photo_path),
      assetUrl(settings?.president_sig),
      assetUrl(settings?.secretary_sig)
    ])
    return {
      member,
      settings: settings || {},
      logoUrl: logoUrl(),
      photoUrl,
      presSigUrl,
      secSigUrl
    }
  }

  async function generatePdf(member) {
    setBanner(null)
    try {
      printCredential(await buildData(member))
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function generatePng(member) {
    setBanner(null)
    try {
      await downloadCredentialPng(await buildData(member))
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  return (
    <div className="card">
      <h2>Credenciais</h2>
      <small>Gera a credencial (PDF) do membro conforme o cargo, com a logo e as assinaturas configuradas.</small>
      {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 10 }}>{banner.msg}</div>}

      <label style={{ marginTop: 12 }}>Buscar por nome</label>
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(0)
        }}
        placeholder="Digite um nome..."
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.cargo || '—'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="link-btn" onClick={() => generatePdf(m)}>PDF</button>
                  {' · '}
                  <button className="link-btn" onClick={() => generatePng(m)}>PNG</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="3" style={{ color: '#999' }}>Nenhum membro ativo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} size={SIZE} total={total} onPage={setPage} />
    </div>
  )
}

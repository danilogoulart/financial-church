import { useContext, useEffect, useState } from 'react'
import { getCheckinToken, regenerateCheckinToken } from '../api'
import { attendanceQr, checkinUrl } from '../qr'
import { downloadDataUrl } from '../../lib/pixImage'
import { RoleContext } from '../role'

// Aba restrita (admin/presidencia/secretaria): gera e regenera o QR de presença.
// O relatório de presença fica em Pessoas → Relatórios de Membros.
export default function Attendance() {
  const { canWriteMembers: canWrite } = useContext(RoleContext)
  const [banner, setBanner] = useState(null)
  const [token, setToken] = useState(null)
  const [fixedQr, setFixedQr] = useState(null)

  async function loadQr() {
    try {
      const t = await getCheckinToken()
      setToken(t)
      setFixedQr(await attendanceQr(t))
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => { loadQr() }, [])

  async function regenerate() {
    if (!window.confirm('Regenerar o QR? Os QRs já impressos/compartilhados deixarão de funcionar.')) return
    setBanner(null)
    try {
      const t = await regenerateCheckinToken()
      setToken(t)
      setFixedQr(await attendanceQr(t))
      setBanner({ type: 'ok', msg: 'QR regenerado. Compartilhe/imprima o novo.' })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  return (
    <div className="card">
      <h2>QR de presença</h2>
      <small>
        Imprima ou projete este QR. O membro escaneia, faz login e o sistema registra a
        presença no <b>culto que estiver acontecendo</b> naquele horário — conforme o
        <b> dia e horário</b> cadastrados em <b>Configurações → Cultos</b>. O relatório de
        presença fica em <b>Relatórios de Membros</b>.
      </small>
      {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 10 }}>{banner.msg}</div>}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {fixedQr ? (
          <>
            <img src={fixedQr} alt="QR de presença" style={{ width: 260, maxWidth: '100%' }} />
            <div style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 6 }}>
              {token ? checkinUrl(token) : ''}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="link-btn" onClick={() => downloadDataUrl(fixedQr, 'presenca-alpha-qrcode.png')}>
                ⬇️ Baixar QR (alta definição)
              </button>
              {canWrite && (
                <button className="link-btn" onClick={regenerate}>🔄 Regenerar QR</button>
              )}
            </div>
          </>
        ) : (
          <span style={{ color: '#999' }}>Gerando QR...</span>
        )}
      </div>
    </div>
  )
}

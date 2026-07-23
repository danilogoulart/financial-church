import { useEffect, useState } from 'react'
import { formatMoney, payableAlerts } from '../api'

// Alertas de contas vencidas / a vencer. Não renderiza nada se não houver.
export default function AlertsCard() {
  const [alerts, setAlerts] = useState(null)

  useEffect(() => {
    payableAlerts(7).then(setAlerts).catch(() => {})
  }, [])

  if (!alerts || (alerts.overdue.length === 0 && alerts.soon.length === 0)) return null

  return (
    <div className="card">
      <h2>Alertas de contas</h2>
      {alerts.overdue.length > 0 && (
        <div className="banner err">
          <b>Vencidas ({alerts.overdue.length}):</b> {formatMoney(alerts.overdueTotal)}
        </div>
      )}
      {alerts.soon.length > 0 && (
        <div className="banner" style={{ background: '#FFF8E1', color: '#8a6d00' }}>
          <b>A vencer em 7 dias ({alerts.soon.length}):</b> {formatMoney(alerts.soonTotal)}
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[...alerts.overdue, ...alerts.soon].map((p) => (
              <tr key={p.id}>
                <td>{p.description}</td>
                <td>{p.due_date}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

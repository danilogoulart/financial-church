import { formatMoney } from './api'
import { APP_NAME } from './brand'

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

function catRows(map) {
  const keys = Object.keys(map).sort((a, b) => map[b] - map[a])
  if (keys.length === 0) return '<tr><td colspan="2" class="muted">Sem lançamentos</td></tr>'
  return keys
    .map((k) => `<tr><td>${esc(k)}</td><td class="r">${formatMoney(map[k])}</td></tr>`)
    .join('')
}

// Abre uma janela de impressão com o balancete do período. O usuário
// salva como PDF pela própria caixa de impressão do navegador.
export function printBalancete({ from, to, totals }) {
  const now = new Date().toLocaleDateString('pt-BR')

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Prestação de Contas — ${esc(APP_NAME)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
  h1 { text-align: center; margin: 0 0 4px; font-size: 22px; }
  h2 { text-align: center; margin: 0 0 4px; font-size: 15px; font-weight: normal; color: #444; }
  .meta { text-align: center; color: #666; font-size: 12px; margin-bottom: 24px; }
  h3 { font-size: 14px; margin: 20px 0 6px; border-bottom: 2px solid #111; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 6px 4px; border-bottom: 1px solid #ddd; }
  .r { text-align: right; }
  .muted { color: #999; }
  .tot td { font-weight: bold; border-top: 2px solid #111; border-bottom: none; }
  .result { margin-top: 20px; font-size: 16px; font-weight: bold; text-align: right; }
  .sign { display: flex; gap: 48px; margin-top: 64px; }
  .sign div { flex: 1; text-align: center; border-top: 1px solid #111; padding-top: 6px; font-size: 12px; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <h1>${esc(APP_NAME)}</h1>
  <h2>Prestação de Contas</h2>
  <div class="meta">Período: ${esc(from)} a ${esc(to)} &middot; Gerado em ${now}</div>

  <h3>Receitas</h3>
  <table>
    <tbody>
      ${catRows(totals.incomeByCategory)}
      <tr class="tot"><td>Total de Receitas</td><td class="r">${formatMoney(totals.totalIncome)}</td></tr>
    </tbody>
  </table>

  <h3>Despesas</h3>
  <table>
    <tbody>
      ${catRows(totals.expenseByCategory)}
      <tr class="tot"><td>Total de Despesas</td><td class="r">${formatMoney(totals.totalExpense)}</td></tr>
    </tbody>
  </table>

  <div class="result">Resultado do período: ${formatMoney(totals.balance)}</div>

  <div class="sign">
    <div>Tesoureiro(a)</div>
    <div>Presidente</div>
  </div>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups neste site para gerar o PDF.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    try {
      w.print()
    } catch (e) {
      /* usuário pode imprimir manualmente */
    }
  }, 400)
}

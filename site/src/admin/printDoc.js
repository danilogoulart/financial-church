// Abre uma janela de impressão com o HTML fornecido (o usuário salva como PDF).
export function printHtml(title, bodyHtml) {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para gerar o PDF.')
    return
  }
  w.document.write(
    `<html><head><title>${title}</title><meta charset="utf-8"><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;font-size:12px}
      h1{font-size:20px;margin:0 0 2px}
      h2{font-size:15px;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}
      table{border-collapse:collapse;width:100%;margin-bottom:8px}
      th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}
      th{background:#f0f0f0}
      td.r,th.r{text-align:right}
      .muted{color:#666} .tot td{font-weight:bold;background:#fafafa}
      .kpis{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
      .kpi{border:1px solid #ccc;border-radius:8px;padding:8px 12px;min-width:130px}
      .kpi b{display:block;font-size:16px}
      @media print{body{padding:0}}
    </style></head><body>${bodyHtml}</body></html>`
  )
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}

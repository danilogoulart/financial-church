import { credentialCardHtml, CREDENTIAL_CSS } from './credential'

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

// Abre uma janela de impressão com a credencial (imprime/salva como PDF).
export function printCredential(data) {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Credencial — ${esc(data.member?.name)}</title>
<style>
  body { margin: 0; display: flex; justify-content: center; padding: 24px; }
  ${CREDENTIAL_CSS}
  @media print { body { padding: 0; } }
</style></head>
<body onload="window.print()">
  ${credentialCardHtml(data)}
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para gerar a credencial.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
}

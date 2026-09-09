// Exporta dados como planilha .xls (HTML que o Excel/Sheets abre). Sem dependências.
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function exportXls(filename, sheetName, headers, rows) {
  const thead = '<tr>' + headers.map((h) => `<th>${esc(h)}</th>`).join('') + '</tr>'
  const tbody = rows
    .map((r) => '<tr>' + r.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>')
    .join('')
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
    'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">' +
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
    `<x:Name>${esc(sheetName)}</x:Name>` +
    '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
    '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
    '</head><body><table border="1">' + thead + tbody + '</table></body></html>'

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xls') ? filename : filename + '.xls'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

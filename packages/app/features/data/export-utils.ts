const csvEscape = (value: unknown) => {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const xmlEscape = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export const rowsToCsv = <T extends Record<string, unknown>>(rows: T[]) => {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0] ?? {})
  const content = rows.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(',')
  )
  return [headers.join(','), ...content].join('\n')
}

const splitCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}

export const parseCsvRows = (rawText: string) => {
  const text = rawText.replace(/^\uFEFF/, '').replaceAll('\r', '')
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  return lines.map(splitCsvLine)
}

export const csvRowsToObjects = (rows: string[][]) => {
  const [headerRow, ...bodyRows] = rows
  if (!headerRow || headerRow.length === 0) return []
  return bodyRows.map((row) => {
    const output: Record<string, string> = {}
    headerRow.forEach((header, index) => {
      output[header] = row[index] ?? ''
    })
    return output
  })
}

export const rowsToExcelXml = <T extends Record<string, unknown>>(
  rows: T[],
  sheetName = 'Sheet1'
) => {
  const headers = Object.keys(rows[0] ?? {})
  const headerCells = headers
    .map((header) => `<Cell><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`)
    .join('')
  const bodyRows = rows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header]
          const numericValue =
            typeof value === 'number' ||
            (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value)))
          const type = numericValue ? 'Number' : 'String'
          return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`
        })
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  const tableRows = headers.length > 0 ? `<Row>${headerCells}</Row>${bodyRows}` : ''
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${xmlEscape(sheetName)}">
  <Table>${tableRows}</Table>
 </Worksheet>
</Workbook>`
}

export const downloadRowsAsExcel = <T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  sheetName = 'Sheet1'
) => {
  const content = rowsToExcelXml(rows, sheetName)
  downloadTextFile(filename, content, 'application/vnd.ms-excel;charset=utf-8')
}

export const openPrintWindow = ({
  title,
  html,
  autoPrint = true,
}: {
  title: string
  html: string
  autoPrint?: boolean
}) => {
  if (typeof window === 'undefined') return false
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=860')
  if (!popup) return false

  popup.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${xmlEscape(title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      font-size: 14px;
      line-height: 1.45;
    }
    h1, h2, h3 {
      margin: 0 0 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.04em;
    }
    .muted {
      color: #64748b;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`)
  popup.document.close()
  popup.focus()
  if (autoPrint) popup.print()
  return true
}

export const downloadTextFile = (
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
) => {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

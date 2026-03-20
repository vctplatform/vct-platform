/**
 * Professional PDF export utility with VCT branding.
 * Uses browser print dialog for zero-dependency PDF generation.
 */

interface PDFExportOptions {
    title: string
    subtitle?: string
    headers: string[]
    rows: string[][]
    filename: string
    orientation?: 'portrait' | 'landscape'
}

export function exportToPDF({
    title,
    subtitle,
    headers,
    rows,
    filename,
    orientation = 'portrait',
}: PDFExportOptions): void {
    const timestamp = new Date().toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })

    const tableRows = rows
        .map(
            (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
        )
        .join('')

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(filename)}</title>
    <style>
        @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4'};
            margin: 16mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; font-size: 11px; }
        
        /* Header with VCT branding */
        .header {
            display: flex; align-items: center; justify-content: space-between;
            padding-bottom: 16px; margin-bottom: 16px;
            border-bottom: 3px solid #0ea5e9;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .logo {
            width: 44px; height: 44px; border-radius: 12px;
            background: linear-gradient(135deg, #0ea5e9, #06b6d4);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 900; font-size: 18px;
        }
        .header h1 { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .header h2 { font-size: 11px; color: #64748b; font-weight: 400; }
        .header-right { text-align: right; font-size: 10px; color: #94a3b8; }
        .header-right div { margin-bottom: 2px; }
        
        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        thead th {
            background: #f1f5f9; color: #475569; font-weight: 700; font-size: 10px;
            text-transform: uppercase; letter-spacing: 0.05em;
            padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0;
        }
        tbody td {
            padding: 7px 10px; border-bottom: 1px solid #f1f5f9;
            font-size: 11px; color: #334155;
        }
        tbody tr:hover { background: #f8fafc; }
        tbody tr:nth-child(even) { background: #fafbfc; }
        
        /* Footer */
        .footer {
            margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;
            font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;
        }
        
        @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">VCT</div>
            <div>
                <h1>${escapeHtml(title)}</h1>
                ${subtitle ? `<h2>${escapeHtml(subtitle)}</h2>` : ''}
            </div>
        </div>
        <div class="header-right">
            <div><strong>VCT Platform</strong></div>
            <div>Võ Cổ Truyền Việt Nam</div>
            <div>${timestamp}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
    
    <div class="footer">
        <span>Tổng: ${rows.length} bản ghi</span>
        <span>Xuất bởi VCT Platform · ${timestamp}</span>
    </div>
</body>
</html>`

    // Open print dialog in new window
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
        alert('Trình duyệt đã chặn popup. Vui lòng cho phép popup để xuất PDF.')
        return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
        printWindow.print()
    }
}

function escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

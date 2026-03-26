/**
 * VCT Print Templates
 * 
 * Print-ready HTML templates for tournament documents.
 * Usage: Open in browser → Ctrl+P → Print/Save as PDF
 * 
 * Templates:
 * 1. Medal Certificate (A4 landscape)
 * 2. Match Report (A4 portrait)
 * 3. Medal Summary Table (A4)
 * 4. Athlete Badge Card
 * 5. Weigh-in Report
 */

'use client'

import { VCT_Text } from '@vct/ui'

/* ═══════════════════════════════════════════════════════════════
   SHARED PRINT STYLES
   ═══════════════════════════════════════════════════════════════ */

const printStyles = `
@media print {
  body { background: var(--vct-bg-elevated) !important; margin: 0; }
  .no-print { display: none !important; }
  .print-page { page-break-after: always; }
}
`

function PrintStyleSheet() {
    return <style dangerouslySetInnerHTML={{ __html: printStyles }} />
}

/* ═══════════════════════════════════════════════════════════════
   1. MEDAL CERTIFICATE (A4 Landscape)
   ═══════════════════════════════════════════════════════════════ */

interface CertificateData {
    athleteName: string
    teamName: string
    category: string
    medal: 'gold' | 'silver' | 'bronze'
    tournamentName: string
    date: string
    signedBy: string
}

export function PrintCertificate({ data }: { data: CertificateData }) {
    const medalColors = {
        gold: { border: '#d4a017', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', icon: '🥇', text: 'HUY CHƯƠNG VÀNG' },
        silver: { border: 'var(--vct-text-tertiary)', bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', icon: '🥈', text: 'HUY CHƯƠNG BẠC' },
        bronze: { border: 'var(--vct-warning)', bg: 'linear-gradient(135deg, #fef3c7, #fed7aa)', icon: '🥉', text: 'HUY CHƯƠNG ĐỒNG' },
    }
    const m = medalColors[data.medal]

    return (
        <>
            <PrintStyleSheet />
            <div
                className="print-page"
                style={{
                    width: '297mm',
                    minHeight: '210mm',
                    padding: '20mm',
                    background: m.bg,
                    border: `8px double ${m.border}`,
                    fontFamily: "'Times New Roman', serif",
                    textAlign: 'center',
                    position: 'relative',
                }}
            >
                {/* Decorative corners */}
                <div style={{ position: 'absolute', top: 15, left: 15, fontSize: '2rem', opacity: 0.3 }}>✦</div>
                <div style={{ position: 'absolute', top: 15, right: 15, fontSize: '2rem', opacity: 0.3 }}>✦</div>
                <div style={{ position: 'absolute', bottom: 15, left: 15, fontSize: '2rem', opacity: 0.3 }}>✦</div>
                <div style={{ position: 'absolute', bottom: 15, right: 15, fontSize: '2rem', opacity: 0.3 }}>✦</div>

                <div style={{ fontSize: 16, color: '#666', letterSpacing: 3, marginBottom: 8 }}>
                    LIÊN ĐOÀN VÕ THUẬT CỔ TRUYỀN VIỆT NAM
                </div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
                    {data.tournamentName}
                </div>

                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--vct-bg-base)', marginBottom: 4 }}>
                    GIẤY CHỨNG NHẬN
                </div>
                <div style={{ fontSize: 64, margin: '12px 0' }}>{m.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: m.border, marginBottom: 24, letterSpacing: 4 }}>
                    {m.text}
                </div>

                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Chứng nhận vận động viên</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--vct-bg-base)', marginBottom: 8 }}>
                    {data.athleteName}
                </div>
                <div style={{ fontSize: 18, color: '#444', marginBottom: 24 }}>
                    Đoàn: {data.teamName}
                </div>
                <div style={{ fontSize: 16, color: '#555', marginBottom: 4 }}>
                    Đã đạt thành tích xuất sắc tại nội dung
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 40 }}>
                    {data.category}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 20 }}>
                    <div>
                        <div style={{ fontSize: 14, color: '#666' }}>{data.date}</div>
                    </div>
                    <div>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 14, color: '#666', width: 200, textAlign: 'center' }}>
                            {data.signedBy}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>Trưởng Ban Tổ Chức</div>
                    </div>
                </div>
            </div>
        </>
    )
}

/* ═══════════════════════════════════════════════════════════════
   2. MATCH REPORT (A4 Portrait)
   ═══════════════════════════════════════════════════════════════ */

interface MatchReportData {
    matchId: string
    category: string
    weightClass: string
    round: string
    arena: string
    date: string
    athleteRed: string
    teamRed: string
    athleteBlue: string
    teamBlue: string
    rounds: Array<{ round: number; red: number; blue: number }>
    totalRed: number
    totalBlue: number
    penaltiesRed: number
    penaltiesBlue: number
    winner: string
    winnerCorner: 'red' | 'blue'
    reason: string
    referees: string[]
}

export function PrintMatchReport({ data }: { data: MatchReportData }) {
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ccc', padding: '8px 12px', fontSize: 13, textAlign: 'center',
    }
    const headerStyle: React.CSSProperties = {
        ...cellStyle, background: 'var(--vct-bg-base)', fontWeight: 700, fontSize: 12,
    }

    return (
        <>
            <PrintStyleSheet />
            <div className="print-page" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: "'Segoe UI', sans-serif", color: '#333' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2 }}>LIÊN ĐOÀN VÕ THUẬT CỔ TRUYỀN VIỆT NAM</div>
                    <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0' }}>BIÊN BẢN TRẬN ĐẤU ĐỐI KHÁNG</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Mã trận: {data.matchId} · {data.date}</div>
                </div>

                {/* Match info */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <tbody>
                        <tr>
                            <td style={headerStyle}>Nội dung</td>
                            <td style={cellStyle}>{data.category}</td>
                            <td style={headerStyle}>Hạng cân</td>
                            <td style={cellStyle}>{data.weightClass}</td>
                        </tr>
                        <tr>
                            <td style={headerStyle}>Vòng</td>
                            <td style={cellStyle}>{data.round}</td>
                            <td style={headerStyle}>Sàn đấu</td>
                            <td style={cellStyle}>{data.arena}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Athletes */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                        <tr>
                            <th style={{ ...headerStyle, background: 'var(--vct-danger-muted)', color: 'var(--vct-danger)' }}>🔴 GÓC ĐỎ</th>
                            <th style={headerStyle}>VS</th>
                            <th style={{ ...headerStyle, background: 'var(--vct-info-muted)', color: 'var(--vct-info)' }}>🔵 GÓC XANH</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...cellStyle, fontWeight: 700, fontSize: 15 }}>{data.athleteRed}</td>
                            <td style={cellStyle}></td>
                            <td style={{ ...cellStyle, fontWeight: 700, fontSize: 15 }}>{data.athleteBlue}</td>
                        </tr>
                        <tr>
                            <td style={cellStyle}>{data.teamRed}</td>
                            <td style={{ ...cellStyle, fontSize: 11, color: '#888' }}>Đoàn</td>
                            <td style={cellStyle}>{data.teamBlue}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Round scores */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                        <tr>
                            <th style={headerStyle}>Hiệp</th>
                            <th style={{ ...headerStyle, background: 'var(--vct-danger-muted)' }}>Điểm Đỏ</th>
                            <th style={{ ...headerStyle, background: 'var(--vct-info-muted)' }}>Điểm Xanh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rounds.map((r) => (
                            <tr key={r.round}>
                                <td style={cellStyle}>Hiệp {r.round}</td>
                                <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--vct-danger)' }}>{r.red}</td>
                                <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--vct-info)' }}>{r.blue}</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ ...headerStyle }}>Phạm lỗi</td>
                            <td style={{ ...cellStyle, color: 'var(--vct-danger)' }}>{data.penaltiesRed}</td>
                            <td style={{ ...cellStyle, color: 'var(--vct-info)' }}>{data.penaltiesBlue}</td>
                        </tr>
                        <tr>
                            <td style={{ ...headerStyle, fontWeight: 700 }}>TỔNG</td>
                            <td style={{ ...cellStyle, fontWeight: 800, fontSize: 18, color: 'var(--vct-danger)' }}>{data.totalRed}</td>
                            <td style={{ ...cellStyle, fontWeight: 800, fontSize: 18, color: 'var(--vct-info)' }}>{data.totalBlue}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Result */}
                <div style={{ textAlign: 'center', padding: 16, border: '2px solid #22c55e', borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: '#666' }}>KẾT QUẢ</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--vct-success)' }}>🏆 {data.winner}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>Hình thức: {data.reason}</div>
                </div>

                {/* Referees */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Hội đồng trọng tài:</div>
                    {data.referees.map((ref, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            {i + 1}. {ref}
                        </div>
                    ))}
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 12, color: '#666', width: 150 }}>
                            Trọng tài chính
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 12, color: '#666', width: 150 }}>
                            Giám sát
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 12, color: '#666', width: 150 }}>
                            Ban tổ chức
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

/* ═══════════════════════════════════════════════════════════════
   3. MEDAL SUMMARY TABLE (A4)
   ═══════════════════════════════════════════════════════════════ */

interface MedalRow {
    rank: number
    team: string
    gold: number
    silver: number
    bronze: number
    total: number
}

export function PrintMedalTable({ data, tournamentName }: { data: MedalRow[]; tournamentName: string }) {
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ccc', padding: '8px 12px', fontSize: 13, textAlign: 'center',
    }

    return (
        <>
            <PrintStyleSheet />
            <div className="print-page" style={{ width: '210mm', padding: '15mm', fontFamily: "'Segoe UI', sans-serif" }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2 }}>LIÊN ĐOÀN VÕ THUẬT CỔ TRUYỀN VIỆT NAM</div>
                    <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0' }}>BẢNG TỔNG SẮP HUY CHƯƠNG</div>
                    <div style={{ fontSize: 14, color: '#666' }}>{tournamentName}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ ...cellStyle, background: 'var(--vct-bg-base)', fontWeight: 700 }}>Hạng</th>
                            <th style={{ ...cellStyle, background: 'var(--vct-bg-base)', fontWeight: 700, textAlign: 'left' }}>Đoàn</th>
                            <th style={{ ...cellStyle, background: '#fef3c7', fontWeight: 700 }}>🥇 Vàng</th>
                            <th style={{ ...cellStyle, background: 'var(--vct-text-primary)', fontWeight: 700 }}>🥈 Bạc</th>
                            <th style={{ ...cellStyle, background: '#fed7aa', fontWeight: 700 }}>🥉 Đồng</th>
                            <th style={{ ...cellStyle, background: 'var(--vct-bg-base)', fontWeight: 700 }}>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.rank} style={{ background: row.rank <= 3 ? '#fffbeb' : undefined }}>
                                <td style={{ ...cellStyle, fontWeight: row.rank <= 3 ? 700 : 400 }}>{row.rank}</td>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>{row.team}</td>
                                <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--vct-warning)' }}>{row.gold}</td>
                                <td style={{ ...cellStyle, color: 'var(--vct-text-tertiary)' }}>{row.silver}</td>
                                <td style={{ ...cellStyle, color: '#92400e' }}>{row.bronze}</td>
                                <td style={{ ...cellStyle, fontWeight: 700 }}>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

/* ═══════════════════════════════════════════════════════════════
   4. ATHLETE BADGE (ID Card size)
   ═══════════════════════════════════════════════════════════════ */

interface AthleteBadgeData {
    name: string
    team: string
    category: string
    weightClass: string
    athleteId: string
    tournamentName: string
}

export function PrintAthleteBadge({ data }: { data: AthleteBadgeData }) {
    return (
        <>
            <PrintStyleSheet />
            <div style={{
                width: '86mm', height: '54mm', padding: 12,
                border: '2px solid #00bcd4', borderRadius: 8,
                fontFamily: "'Segoe UI', sans-serif",
                background: 'linear-gradient(135deg, #f8fafc, #e0f2fe)',
                display: 'inline-block',
            }}>
                <div style={{ fontSize: 8, color: '#888', letterSpacing: 1, textAlign: 'center' }}>
                    {data.tournamentName}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginTop: 6, color: '#0e7490' }}>
                    THẺ VẬN ĐỘNG VIÊN
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {/* Avatar placeholder */}
                    <div style={{
                        width: 50, height: 60, borderRadius: 4,
                        background: '#e0f2fe', border: '1px solid #bae6fd',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, color: '#0e7490', fontWeight: 700, flexShrink: 0,
                    }}>
                        {data.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vct-bg-base)' }}>{data.name}</div>
                        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{data.team}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>{data.category}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>{data.weightClass}</div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 6, fontSize: 9, color: '#888', fontFamily: 'monospace' }}>
                    ID: {data.athleteId}
                </div>
            </div>
        </>
    )
}

/* ═══════════════════════════════════════════════════════════════
   5. WEIGH-IN REPORT (A4)
   ═══════════════════════════════════════════════════════════════ */

interface WeighInRow {
    stt: number
    name: string
    team: string
    weightClass: string
    actualWeight: number
    result: 'dat' | 'khong_dat'
}

export function PrintWeighInReport({ data, date, tournamentName }: { data: WeighInRow[]; date: string; tournamentName: string }) {
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ccc', padding: '6px 10px', fontSize: 12, textAlign: 'center',
    }

    return (
        <>
            <PrintStyleSheet />
            <div className="print-page" style={{ width: '210mm', padding: '15mm', fontFamily: "'Segoe UI', sans-serif" }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2 }}>LIÊN ĐOÀN VÕ THUẬT CỔ TRUYỀN VIỆT NAM</div>
                    <div style={{ fontSize: 18, fontWeight: 700, margin: '8px 0' }}>BIÊN BẢN CÂN KÝ</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{tournamentName} · {date}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {['STT', 'Họ tên VĐV', 'Đoàn', 'Hạng cân', 'Cân nặng TT', 'Kết quả'].map((h) => (
                                <th key={h} style={{ ...cellStyle, background: 'var(--vct-bg-base)', fontWeight: 700 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.stt}>
                                <td style={cellStyle}>{row.stt}</td>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>{row.name}</td>
                                <td style={cellStyle}>{row.team}</td>
                                <td style={cellStyle}>{row.weightClass}</td>
                                <td style={{ ...cellStyle, fontWeight: 700 }}>{row.actualWeight}kg</td>
                                <td style={{
                                    ...cellStyle,
                                    fontWeight: 700,
                                    color: row.result === 'dat' ? 'var(--vct-success)' : 'var(--vct-danger)',
                                }}>
                                    {row.result === 'dat' ? '✓ Đạt' : '✗ Không đạt'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 12, color: '#666', width: 150 }}>Người cân</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 12, color: '#666', width: 150 }}>Giám sát</div>
                    </div>
                </div>
            </div>
        </>
    )
}

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PUBLIC CERTIFICATION VERIFICATION PAGE
// Public-facing page for verifying certificates by QR code
// or certificate number. No auth required.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState } from 'react';
import { useApiFetch } from './useApiFetch';

// ── Types ────────────────────────────────────────────────────

interface CertResult {
    found: boolean;
    cert_number: string;
    holder_name: string;
    cert_type: string;
    issued_by: string;
    issued_date: string;
    expiry_date: string;
    status: 'valid' | 'expired' | 'revoked';
    details: string;
}

const MOCK_RESULTS: Record<string, CertResult> = {
    'HLV-2025-00142': {
        found: true, cert_number: 'HLV-2025-00142',
        holder_name: 'Nguyễn Văn A', cert_type: 'Chứng nhận Huấn luyện viên',
        issued_by: 'Liên đoàn Võ cổ truyền Việt Nam', issued_date: '2025-06-15',
        expiry_date: '2027-06-15', status: 'valid',
        details: 'HLV cấp Quốc gia — Huyền đai tam đẳng',
    },
    'TT-2024-00089': {
        found: true, cert_number: 'TT-2024-00089',
        holder_name: 'Trần Thị B', cert_type: 'Thẻ Trọng tài Quốc gia',
        issued_by: 'Liên đoàn Võ cổ truyền Việt Nam', issued_date: '2024-03-20',
        expiry_date: '2024-12-31', status: 'expired',
        details: 'Trọng tài cấp Quốc gia — Đã hết hạn, cần gia hạn',
    },
    'CLB-2026-00231': {
        found: true, cert_number: 'CLB-2026-00231',
        holder_name: 'CLB Tân Khánh Bà Trà - Quận 7', cert_type: 'Giấy phép CLB',
        issued_by: 'Liên đoàn Võ cổ truyền Việt Nam', issued_date: '2026-01-10',
        expiry_date: '2028-01-10', status: 'valid',
        details: 'CLB được cấp phép hoạt động tại TP.HCM',
    },
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    valid: { label: 'Hợp lệ', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
    expired: { label: 'Hết hạn', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⚠️' },
    revoked: { label: 'Đã thu hồi', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '❌' },
};

// ── Component ────────────────────────────────────────────────

export function Page_cert_verification() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<CertResult | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [searching, setSearching] = useState(false);
    const certApi = useApiFetch<CertResult>();

    const handleSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        setResult(null);
        setNotFound(false);

        // Try real API first
        const apiResult = await certApi.execute(`/public/certifications/verify/${query.trim()}`);
        if (apiResult && (apiResult as any).found !== false) {
            setResult(apiResult);
            setSearching(false);
            return;
        }

        // Fallback to mock for demo
        const found = MOCK_RESULTS[query.trim().toUpperCase()];
        if (found) {
            setResult(found);
            setNotFound(false);
        } else {
            setResult(null);
            setNotFound(true);
        }
        setSearching(false);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px', fontFamily: "'Inter', sans-serif",
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}>
            {/* Logo / Branding */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    Xác minh Chứng nhận
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
                    Liên đoàn Võ cổ truyền Việt Nam — Hệ thống Xác minh trực tuyến
                </p>
            </div>

            {/* Search Card */}
            <div style={{
                background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 20, padding: 32, width: '100%', maxWidth: 520,
                backdropFilter: 'blur(12px)',
            }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
                    Nhập số chứng nhận hoặc mã QR
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="VD: HLV-2025-00142 hoặc TT-2024-00089"
                        style={{
                            flex: 1, padding: '12px 16px', borderRadius: 10,
                            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)',
                            color: '#e2e8f0', fontSize: 14, outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        style={{
                            padding: '12px 24px', borderRadius: 10, border: 'none',
                            background: searching ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: searching ? 'wait' : 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {searching ? '⏳...' : '🔍 Xác minh'}
                    </button>
                </div>

                {/* Demo hint */}
                <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>
                    Thử: <code style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => setQuery('HLV-2025-00142')}>HLV-2025-00142</code>
                    {' • '}
                    <code style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => setQuery('TT-2024-00089')}>TT-2024-00089</code>
                    {' • '}
                    <code style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => setQuery('CLB-2026-00231')}>CLB-2026-00231</code>
                </div>
            </div>

            {/* Result */}
            {result && (
                <div style={{
                    marginTop: 24, width: '100%', maxWidth: 520,
                    background: 'rgba(30,41,59,0.6)', border: `1px solid ${STATUS_STYLE[result.status]?.color ?? '#94a3b8'}30`,
                    borderRadius: 20, padding: 28, backdropFilter: 'blur(12px)',
                }}>
                    {/* Status Banner */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                        padding: '12px 16px', borderRadius: 12,
                        background: STATUS_STYLE[result.status]?.bg ?? 'rgba(148,163,184,0.1)',
                    }}>
                        <span style={{ fontSize: 24 }}>{STATUS_STYLE[result.status]?.icon ?? '❓'}</span>
                        <div>
                            <div style={{
                                fontSize: 16, fontWeight: 700,
                                color: STATUS_STYLE[result.status]?.color ?? '#94a3b8',
                            }}>
                                Chứng nhận {STATUS_STYLE[result.status]?.label ?? 'Không xác định'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{result.cert_number}</div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    {[
                        { label: 'Người được cấp', value: result.holder_name },
                        { label: 'Loại chứng nhận', value: result.cert_type },
                        { label: 'Cơ quan cấp', value: result.issued_by },
                        { label: 'Ngày cấp', value: result.issued_date },
                        { label: 'Hiệu lực đến', value: result.expiry_date },
                        { label: 'Chi tiết', value: result.details },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                            borderBottom: '1px solid rgba(148,163,184,0.08)',
                        }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Not Found */}
            {notFound && (
                <div style={{
                    marginTop: 24, width: '100%', maxWidth: 520,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 16, padding: 24, textAlign: 'center',
                }}>
                    <span style={{ fontSize: 36 }}>🔍</span>
                    <h3 style={{ color: '#ef4444', fontSize: 16, marginTop: 8 }}>Không tìm thấy chứng nhận</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>
                        Mã "{query}" không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc liên hệ Liên đoàn.
                    </p>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#475569' }}>
                © 2026 Liên đoàn Võ cổ truyền Việt Nam • Nền tảng quản trị võ thuật toàn diện
            </div>
        </div>
    );
}

export default Page_cert_verification;

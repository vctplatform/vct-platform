'use client'

export default function OfflinePage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0f1a',
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
                padding: '2rem',
            }}
        >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Mất kết nối mạng
            </h1>
            <p style={{ color: '#94a3b8', maxWidth: 400, lineHeight: 1.6 }}>
                Bạn đang ở chế độ offline. Một số tính năng có thể bị hạn chế.
                Dữ liệu chấm điểm sẽ được tự động đồng bộ khi có mạng trở lại.
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: '1.5rem',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#00bcd4',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                }}
            >
                🔄 Thử lại
            </button>
        </div>
    )
}

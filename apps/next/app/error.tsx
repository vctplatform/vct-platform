'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh', padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Đã xảy ra lỗi</h2>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>{error.message || 'Không thể tải trang hiện tại.'}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: '1px solid #0ea5e9',
            color: '#0ea5e9',
            background: 'transparent',
            borderRadius: 10,
            padding: '8px 14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}

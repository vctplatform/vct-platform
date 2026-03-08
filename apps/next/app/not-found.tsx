import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Không tìm thấy trang</h2>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>Liên kết có thể đã thay đổi hoặc không tồn tại.</p>
        <Link href="/" style={{ color: '#0ea5e9', fontWeight: 700 }}>
          Về trang tổng quan
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid place-items-center min-h-[50vh] p-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Không tìm thấy trang</h2>
        <p className="opacity-70 mb-4 text-(--vct-text-primary)">Liên kết có thể đã thay đổi hoặc không tồn tại.</p>
        <Link href="/" className="text-(--vct-accent-cyan) font-bold hover:opacity-80 transition">
          Về trang tổng quan
        </Link>
      </div>
    </div>
  )
}

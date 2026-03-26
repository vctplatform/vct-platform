'use client'

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-(--vct-bg-base) text-(--vct-text-primary) font-sans text-center p-8">
            <div className="text-6xl mb-4">📡</div>
            <h1 className="text-2xl font-bold m-0 mb-2">
                Mất kết nối mạng
            </h1>
            <p className="text-(--vct-text-tertiary) max-w-[400px] leading-relaxed">
                Bạn đang ở chế độ offline. Một số tính năng có thể bị hạn chế.
                Dữ liệu chấm điểm sẽ được tự động đồng bộ khi có mạng trở lại.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-8 py-3 rounded-xl border-none bg-(--vct-accent-cyan) text-(--vct-text-on-accent) font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
            >
                🔄 Thử lại
            </button>
        </div>
    )
}

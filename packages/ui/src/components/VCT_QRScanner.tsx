'use client'

/**
 * VCT QR Scanner
 * 
 * Uses the browser's getUserMedia API for live QR code scanning.
 * Used for athlete check-in, badge verification, etc.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Button, VCT_Card } from './vct-ui-layout'

/* ═══════════════════════════════════════════════════════════════
   QR SCANNER COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface QRScannerProps {
    onScan: (data: string) => void
    onClose: () => void
    title?: string
}

export function VCT_QRScanner({ onScan, onClose, title = 'Quét mã QR' }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [scannedData, setScannedData] = useState<string | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
        }
    }, [])

    useEffect(() => {
        let active = true

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
                })
                if (!active) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                streamRef.current = stream
                setHasPermission(true)

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play()
                }
            } catch {
                if (active) setHasPermission(false)
            }
        }

        startCamera()

        return () => {
            active = false
            stopCamera()
        }
    }, [stopCamera])

    // Simulated QR scanning loop
    // In production, use a lib like jsQR or html5-qrcode
    useEffect(() => {
        if (!hasPermission || scannedData) return

        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        function scanFrame() {
            if (!video || !ctx || !canvas) return
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                // In production: 
                // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                // const code = jsQR(imageData.data, imageData.width, imageData.height)
                // if (code) { setScannedData(code.data); onScan(code.data) }
            }
            animFrameRef.current = requestAnimationFrame(scanFrame)
        }

        scanFrame()

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [hasPermission, scannedData, onScan])

    // Demo: simulate scan after 3 seconds
    useEffect(() => {
        if (!hasPermission || scannedData) return
        const timer = setTimeout(() => {
            const demoData = 'VDV-2026-001'
            setScannedData(demoData)
            onScan(demoData)
        }, 5000)
        return () => clearTimeout(timer)
    }, [hasPermission, scannedData, onScan])

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80">
                <VCT_Text variant="h3" className="text-white !m-0">📷 {title}</VCT_Text>
                <button
                    onClick={() => { stopCamera(); onClose() }}
                    className="bg-transparent border-none text-white text-xl cursor-pointer p-2"
                >
                    ✕
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {hasPermission === false && (
                    <div className="text-center p-6">
                        <div className="text-[3rem] mb-3">🚫</div>
                        <VCT_Text variant="h3" className="text-white">Không có quyền camera</VCT_Text>
                        <VCT_Text variant="body" className="text-slate-400">
                            Vui lòng cấp quyền camera trong cài đặt trình duyệt
                        </VCT_Text>
                    </div>
                )}

                {hasPermission === null && (
                    <div className="text-center">
                        <div className="text-[2rem] mb-3">📷</div>
                        <VCT_Text variant="body" className="text-slate-400">Đang mở camera...</VCT_Text>
                    </div>
                )}

                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${hasPermission ? 'block' : 'hidden'}`}
                    playsInline
                    muted
                />

                {/* QR viewfinder overlay */}
                {hasPermission && !scannedData && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            className="w-[250px] h-[250px] border-3 border-(--vct-accent-cyan) rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                            animate={{ borderColor: ['#00bcd4', '#7c3aed', '#00bcd4'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Scan line */}
                        <motion.div
                            className="absolute w-[230px] h-0.5 bg-gradient-to-r from-transparent via-(--vct-accent-cyan) to-transparent"
                            animate={{ y: [-100, 100] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                )}

                {/* Hidden canvas for frame analysis */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Scanned Result */}
            <AnimatePresence>
                {scannedData && (
                    <motion.div
                        className="p-4 bg-black/90"
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                    >
                        <VCT_Card>
                            <div className="p-4 text-center">
                                <div className="text-[2rem] mb-2">✅</div>
                                <VCT_Text variant="h3">Đã quét thành công!</VCT_Text>
                                <div className="mt-2 px-4 py-2 rounded-lg mx-auto bg-(--vct-bg-input) font-mono text-base font-bold text-(--vct-accent-cyan) inline-block">
                                    {scannedData}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <VCT_Button variant="ghost" style={{ flex: 1 }} onClick={() => setScannedData(null)}>
                                        Quét lại
                                    </VCT_Button>
                                    <VCT_Button variant="primary" style={{ flex: 1 }} onClick={() => { stopCamera(); onClose() }}>
                                        Xác nhận
                                    </VCT_Button>
                                </div>
                            </div>
                        </VCT_Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instructions */}
            {!scannedData && hasPermission && (
                <div className="p-4 text-center bg-black/80">
                    <VCT_Text variant="small" className="text-slate-400">
                        Đưa mã QR vào khung hình để quét
                    </VCT_Text>
                </div>
            )}
        </motion.div>
    )
}

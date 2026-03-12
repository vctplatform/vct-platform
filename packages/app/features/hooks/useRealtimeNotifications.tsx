import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastMessage {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info';
}

export function useRealtimeNotifications() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        // Simulate WebSocket connection
        console.log('[WebSocket] Connecting to wss://vct.vn/ws/federation...');
        const timer = setTimeout(() => {
            console.log('[WebSocket] Connected.');
        }, 1000);

        // Simulate incoming urgent messages
        const interval = setInterval(() => {
            const types: ('success' | 'warning' | 'info')[] = ['success', 'warning', 'info'];
            const messages = [
                { title: 'Tỉnh Bình Định', description: 'Vừa trình duyệt Đăng ký CLB mới' },
                { title: 'Cảnh báo Ngân sách', description: 'Đề xuất chi vượt mức 50,000,000đ' },
                { title: 'Giải đấu mới', description: 'Đã nhận hồ sơ Giải Võ Cổ Truyền Miền Trung' },
                { title: 'Tỉnh Quảng Nam', description: 'Vừa cập nhật danh sách Ban Chấp Hành' }
            ];
            const randType = types[Math.floor(Math.random() * types.length)] || 'info';
            const randMsg = messages[Math.floor(Math.random() * messages.length)];
            
            const newToast: ToastMessage = {
                id: Date.now().toString() + Math.random(),
                title: randMsg?.title || 'Thông báo',
                description: randMsg?.description || 'Có cập nhật mới',
                type: randType
            };

            setToasts(prev => [...prev, newToast]);
            
            // Auto remove after 5s
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 5000);

        }, 12000); // Trigger every 12 seconds for testing purposes

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    const ToastContainer = () => (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] pointer-events-auto cursor-pointer ${
                            t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                            t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                            'bg-sky-500/10 border-sky-500/30'
                        }`}
                        style={{ background: 'var(--vct-bg-elevated)' }}
                        onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">
                                {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div>
                                <h4 className="text-sm font-bold" style={{ color: 'var(--vct-text-primary)' }}>{t.title}</h4>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--vct-text-secondary)' }}>{t.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    return { ToastContainer };
}

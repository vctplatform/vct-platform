'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Federation Regulations Overview Page
// Tổng quan Quy chế Chuyên môn — Điều lệ & Quy chế
// ════════════════════════════════════════════════════════════════

interface MasterDataStats {
    belts: number
    weights: number
    ages: number
}

const BASE = '/api/v1/federation/master'

export function Page_federation_regulations() {
    const router = useRouter()
    const [stats, setStats] = useState<MasterDataStats>({ belts: 0, weights: 0, ages: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const [bRes, wRes, aRes] = await Promise.all([
                    fetch(`${BASE}/belts`).then(r => r.json()).catch(() => ({ belts: [] })),
                    fetch(`${BASE}/weights`).then(r => r.json()).catch(() => ({ weight_classes: [] })),
                    fetch(`${BASE}/ages`).then(r => r.json()).catch(() => ({ age_groups: [] })),
                ])
                setStats({
                    belts: bRes.belts?.length ?? 0,
                    weights: wRes.weight_classes?.length ?? 0,
                    ages: aRes.age_groups?.length ?? 0,
                })
            } catch { /* fallback */ }
            setLoading(false)
        }
        load()
    }, [])

    const cards = [
        {
            icon: '🥋',
            title: 'Hệ thống Đai Đẳng',
            subtitle: 'Belt & Rank System',
            count: stats.belts,
            unit: 'cấp đai',
            color: '#f59e0b',
            bg: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
            tab: 'belt',
        },
        {
            icon: '⚖️',
            title: 'Hạng Cân',
            subtitle: 'Weight Classes',
            count: stats.weights,
            unit: 'hạng',
            color: '#3b82f6',
            bg: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
            tab: 'weight',
        },
        {
            icon: '📅',
            title: 'Nhóm Tuổi',
            subtitle: 'Age Groups',
            count: stats.ages,
            unit: 'nhóm',
            color: '#10b981',
            bg: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
            tab: 'age',
        },
    ]

    return (
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 700, margin: 0,
                    color: 'var(--vct-text, #1e293b)',
                }}>
                    📜 Quy chế Chuyên môn
                </h1>
                <p style={{
                    fontSize: '0.95rem', margin: '0.5rem 0 0',
                    color: 'var(--vct-text-secondary, #64748b)',
                }}>
                    Thiết lập điều lệ, quy chế quản lý chuyên môn theo chuẩn quốc gia
                </p>
            </motion.div>

            {/* Scope info banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                }}
            >
                <span style={{ fontSize: '1.25rem', marginTop: 2 }}>ℹ️</span>
                <div>
                    <strong style={{ color: 'var(--vct-text, #1e293b)', fontSize: '0.9rem' }}>
                        Hệ thống kế thừa quy chế
                    </strong>
                    <p style={{
                        margin: '0.25rem 0 0', fontSize: '0.85rem', lineHeight: 1.6,
                        color: 'var(--vct-text-secondary, #64748b)',
                    }}>
                        <strong>Cấp Quốc gia</strong> thiết lập chuẩn phổ biến toàn quốc.{' '}
                        <strong>Cấp Tỉnh</strong> có thể kế thừa hoặc tự thiết lập riêng.{' '}
                        <strong>Môn phái</strong> có thể áp dụng theo quốc gia, tỉnh, hoặc quy định riêng.
                    </p>
                </div>
            </motion.div>

            {/* Summary cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
            }}>
                {cards.map((card, i) => (
                    <motion.div
                        key={card.tab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        onClick={() => router.push(`/federation/master-data?tab=${card.tab}`)}
                        style={{
                            padding: '1.5rem',
                            borderRadius: 16,
                            background: card.bg,
                            border: `1px solid ${card.color}22`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${card.color}15` }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                                <h3 style={{
                                    fontSize: '1.1rem', fontWeight: 600, margin: '0.5rem 0 0.15rem',
                                    color: 'var(--vct-text, #1e293b)',
                                }}>{card.title}</h3>
                                <p style={{
                                    fontSize: '0.8rem', margin: 0,
                                    color: 'var(--vct-text-secondary, #64748b)',
                                }}>{card.subtitle}</p>
                            </div>
                            <div style={{
                                fontSize: '2rem', fontWeight: 700,
                                color: card.color,
                                opacity: loading ? 0.3 : 1,
                            }}>
                                {loading ? '–' : card.count}
                            </div>
                        </div>
                        <div style={{
                            marginTop: '0.75rem',
                            fontSize: '0.8rem',
                            color: card.color,
                            fontWeight: 500,
                        }}>
                            {loading ? 'Đang tải...' : `${card.count} ${card.unit} đã thiết lập`}
                        </div>
                        <div style={{
                            marginTop: '0.5rem', fontSize: '0.75rem',
                            color: 'var(--vct-text-secondary, #94a3b8)',
                        }}>
                            Nhấn để quản lý →
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Scope badge — National */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    background: 'var(--vct-card-bg, #fff)',
                    border: '1px solid var(--vct-border, #e2e8f0)',
                }}
            >
                <div style={{
                    display: 'flex', gap: '0.5rem', alignItems: 'center',
                    marginBottom: '0.75rem',
                }}>
                    <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: 6,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        fontSize: '0.75rem', fontWeight: 600,
                    }}>NATIONAL</span>
                    <span style={{
                        fontSize: '0.85rem', fontWeight: 500,
                        color: 'var(--vct-text, #1e293b)',
                    }}>Quy chế cấp Quốc gia — Liên đoàn Võ Cổ Truyền Việt Nam</span>
                </div>
                <p style={{
                    fontSize: '0.82rem', lineHeight: 1.6, margin: 0,
                    color: 'var(--vct-text-secondary, #64748b)',
                }}>
                    Đây là hệ thống quy chế gốc áp dụng cho toàn bộ Liên đoàn.
                    Các cấp tỉnh và môn phái có thể kế thừa hoặc tùy chỉnh theo nhu cầu riêng.
                </p>
            </motion.div>
        </div>
    )
}

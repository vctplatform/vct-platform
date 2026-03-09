'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Tabs, VCT_Badge, VCT_Text, VCT_Table, VCT_Input } from 'app/features/components/vct-ui'
import { VCT_PageTemplate_Dashboard } from 'app/features/components/vct-page-templates'

const DEMO_MEDALS = [
    { rank: 1, team: 'TP.HCM', gold: 12, silver: 8, bronze: 5, total: 25 },
    { rank: 2, team: 'Hà Nội', gold: 10, silver: 9, bronze: 6, total: 25 },
    { rank: 3, team: 'Quân Đội', gold: 5, silver: 4, bronze: 8, total: 17 },
    { rank: 4, team: 'Thanh Hóa', gold: 3, silver: 5, bronze: 4, total: 12 },
    { rank: 5, team: 'Đồng Nai', gold: 2, silver: 3, bronze: 6, total: 11 },
]

const DEMO_EVENTS = [
    {
        id: '1', name: 'Đối kháng Nam 60kg', type: 'combat',
        gold: 'Nguyễn Văn A (Hà Nội)', silver: 'Trần Văn B (TP.HCM)', bronze: 'Lê Văn C (Quân Đội)'
    },
    {
        id: '2', name: 'Đơn Luyện Vũ Khí Nam', type: 'forms',
        gold: 'Phạm Văn D (TP.HCM)', silver: 'Hoàng Văn E (Đồng Nai)', bronze: 'Vũ Văn F (Thanh Hóa)'
    },
    {
        id: '3', name: 'Đối kháng Nữ 52kg', type: 'combat',
        gold: 'Nguyễn Thị G (Hà Nội)', silver: 'Lê Thị H (Quân Đội)', bronze: 'Trần Thị I (TP.HCM)'
    },
]

export function Page_ResultsDashboard() {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('medals')

    const filteredEvents = DEMO_EVENTS.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    const MedalTable = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--vct-border-subtle)] overflow-hidden shadow-sm">
            <VCT_Table
                columns={[
                    { key: 'rank', label: 'Hạng', width: 80, align: 'center' },
                    { key: 'rank', label: 'Hạng', width: 80, align: 'center', render: (row) => row.rank },
                    { key: 'team', label: 'Đoàn Thể Thao', render: (row) => <span className="font-bold">{row.team}</span> },
                    { key: 'gold', label: '🥇 Vàng', align: 'center', render: (row) => <span className="text-yellow-600 dark:text-yellow-500 font-bold">{row.gold}</span> },
                    { key: 'silver', label: '🥈 Bạc', align: 'center', render: (row) => <span className="text-gray-500 dark:text-gray-400 font-bold">{row.silver}</span> },
                    { key: 'bronze', label: '🥉 Đồng', align: 'center', render: (row) => <span className="text-orange-700 dark:text-orange-600 font-bold">{row.bronze}</span> },
                    { key: 'total', label: 'Tổng', align: 'center', render: (row) => <span className="font-black text-[var(--vct-text-primary)]">{row.total}</span> },
                ]}
                data={DEMO_MEDALS}
            />
        </div>
    )

    const EventsList = () => (
        <div className="space-y-6">
            <div className="max-w-md">
                <VCT_Input
                    placeholder="Tìm kiếm nội dung thi đấu..."
                    value={search}
                    onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 rounded-xl border border-[var(--vct-border-subtle)] bg-white dark:bg-gray-800 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <VCT_Text variant="h3">{item.name}</VCT_Text>
                            <VCT_Badge
                                type={item.type === 'combat' ? 'danger' : 'info'}
                                text={item.type === 'combat' ? 'Đối kháng' : 'Quyền'}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                <span className="text-2xl">🥇</span>
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.gold}</VCT_Text>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <span className="text-2xl">🥈</span>
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.silver}</VCT_Text>
                            </div>
                            <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50">
                                <span className="text-2xl">🥉</span>
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.bronze}</VCT_Text>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )

    return (
        <VCT_PageTemplate_Dashboard
            title="Kết Quả Giải Đấu"
            subtitle="Bảng tổng sắp huy chương và kết quả chi tiết từng nội dung."
            icon="🏆"
            headerControls={
                <VCT_Badge type="success" text="Đang diễn ra" />
            }
        >
            <div className="mb-6">
                <VCT_Tabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { id: 'medals', label: 'Bảng Tổng Sắp Huy Chương' },
                        { id: 'events', label: 'Kết Quả Chi Tiết' }
                    ]}
                />
            </div>

            {activeTab === 'medals' ? <MedalTable /> : <EventsList />}
        </VCT_PageTemplate_Dashboard>
    )
}

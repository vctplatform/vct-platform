'use client'
import React, { useState, useMemo } from 'react'
import { VCT_Icons } from '../components/vct-icons'

interface BudgetItem {
    id: string; category: string; planned: number; actual: number; type: 'income' | 'expense'
    note: string; status: 'on_track' | 'over' | 'under'
}

const BUDGET: BudgetItem[] = [
    { id: 'b1', category: 'Tài trợ chính', planned: 500000000, actual: 500000000, type: 'income', note: 'Tập đoàn HòaPhát', status: 'on_track' },
    { id: 'b2', category: 'Phí đăng ký tham gia', planned: 84000000, actual: 72000000, type: 'income', note: '360 VĐV x 200k', status: 'under' },
    { id: 'b3', category: 'Tiền thưởng huy chương', planned: 150000000, actual: 145000000, type: 'expense', note: 'HCV 3tr, HCB 2tr, HCĐ 1tr', status: 'on_track' },
    { id: 'b4', category: 'Thuê sân/nhà thi đấu', planned: 100000000, actual: 120000000, type: 'expense', note: 'Nhà thi đấu Bình Định 5 ngày', status: 'over' },
    { id: 'b5', category: 'In ấn/Truyền thông', planned: 30000000, actual: 25000000, type: 'expense', note: 'Banner, backdrop, thẻ VĐV', status: 'on_track' },
    { id: 'b6', category: 'Thiết bị thi đấu', planned: 80000000, actual: 78000000, type: 'expense', note: 'Đệm sàn, găng, giáp', status: 'on_track' },
    { id: 'b7', category: 'Ăn uống/Di chuyển TT', planned: 60000000, actual: 55000000, type: 'expense', note: 'Trọng tài 30 người x 5 ngày', status: 'on_track' },
    { id: 'b8', category: 'Bảo hiểm VĐV', planned: 20000000, actual: 20000000, type: 'expense', note: 'Bảo hiểm tai nạn thi đấu', status: 'on_track' },
]

const fmtVND = (n: number) => (n / 1000000).toFixed(0) + 'tr'

export function Page_finance_budget() {
    const [showType, setShowType] = useState<'all' | 'income' | 'expense'>('all')

    const stats = useMemo(() => {
        const income = BUDGET.filter(b => b.type === 'income')
        const expense = BUDGET.filter(b => b.type === 'expense')
        return {
            totalIncomePlanned: income.reduce((s, b) => s + b.planned, 0),
            totalIncomeActual: income.reduce((s, b) => s + b.actual, 0),
            totalExpensePlanned: expense.reduce((s, b) => s + b.planned, 0),
            totalExpenseActual: expense.reduce((s, b) => s + b.actual, 0),
        }
    }, [])

    const balance = stats.totalIncomeActual - stats.totalExpenseActual
    const filtered = showType === 'all' ? BUDGET : BUDGET.filter(b => b.type === showType)

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="m-0 text-2xl font-black">Ngân Sách Giải Đấu</h1>
                <p className="mt-1 text-sm text-vct-text-muted">Kế hoạch thu chi và theo dõi thực tế</p>
            </div>

            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                <div className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                    <div className="text-xl mb-1">📈</div>
                    <div className="text-2xl font-black text-emerald-500">{fmtVND(stats.totalIncomeActual)}</div>
                    <div className="text-xs text-vct-text-muted">Thu nhập thực tế</div>
                    <div className="text-[10px] text-vct-text-muted">KH: {fmtVND(stats.totalIncomePlanned)}</div>
                </div>
                <div className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                    <div className="text-xl mb-1">📉</div>
                    <div className="text-2xl font-black text-red-500">{fmtVND(stats.totalExpenseActual)}</div>
                    <div className="text-xs text-vct-text-muted">Chi phí thực tế</div>
                    <div className="text-[10px] text-vct-text-muted">KH: {fmtVND(stats.totalExpensePlanned)}</div>
                </div>
                <div className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                    <div className="text-xl mb-1">{balance >= 0 ? '✅' : '⚠️'}</div>
                    <div className={`text-2xl font-black ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{balance >= 0 ? '+' : ''}{fmtVND(balance)}</div>
                    <div className="text-xs text-vct-text-muted">Cân đối</div>
                </div>
                <div className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                    <div className="text-xl mb-1">📊</div>
                    <div className="text-2xl font-black text-amber-500">{Math.round(stats.totalExpenseActual / stats.totalExpensePlanned * 100)}%</div>
                    <div className="text-xs text-vct-text-muted">Tỷ lệ giải ngân</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span>Thu</span><span>Chi</span>
                </div>
                <div className="h-4 rounded-full bg-vct-input overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${stats.totalIncomeActual / (stats.totalIncomeActual + stats.totalExpenseActual) * 100}%` }} />
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${stats.totalExpenseActual / (stats.totalIncomeActual + stats.totalExpenseActual) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-vct-text-muted mt-1">
                    <span className="text-emerald-500 font-bold">{fmtVND(stats.totalIncomeActual)}</span>
                    <span className="text-red-500 font-bold">{fmtVND(stats.totalExpenseActual)}</span>
                </div>
            </div>

            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 w-fit">
                {[{ v: 'all' as const, l: 'Tất cả' }, { v: 'income' as const, l: '📈 Thu' }, { v: 'expense' as const, l: '📉 Chi' }].map(f => (
                    <button key={f.v} onClick={() => setShowType(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${showType === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                ))}
            </div>

            <div className="rounded-xl border border-vct-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-vct-elevated">
                        <tr>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Hạng mục</th>
                            <th className="text-right px-4 py-3 font-bold text-vct-text-muted">Kế hoạch</th>
                            <th className="text-right px-4 py-3 font-bold text-vct-text-muted">Thực tế</th>
                            <th className="text-center px-4 py-3 font-bold text-vct-text-muted">%</th>
                            <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Trạng thái</th>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(b => {
                            const pct = Math.round(b.actual / b.planned * 100)
                            return (
                                <tr key={b.id} className="border-t border-vct-border hover:bg-vct-elevated/50 transition">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${b.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="font-bold">{b.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-vct-text-muted">{fmtVND(b.planned)}</td>
                                    <td className="px-4 py-3 text-right font-bold">{fmtVND(b.actual)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-bold ${pct > 100 ? 'text-red-500' : pct >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{pct}%</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.status === 'on_track' ? 'bg-emerald-500/15 text-emerald-600' : b.status === 'over' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                            {b.status === 'on_track' ? '✅ Đúng KH' : b.status === 'over' ? '⚠️ Vượt' : '📉 Thiếu'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-vct-text-muted">{b.note}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="bg-vct-elevated font-bold">
                        <tr className="border-t-2 border-vct-border">
                            <td className="px-4 py-3">Tổng cộng</td>
                            <td className="px-4 py-3 text-right">{fmtVND(filtered.reduce((s, b) => s + b.planned, 0))}</td>
                            <td className="px-4 py-3 text-right">{fmtVND(filtered.reduce((s, b) => s + b.actual, 0))}</td>
                            <td className="px-4 py-3 text-center">{Math.round(filtered.reduce((s, b) => s + b.actual, 0) / filtered.reduce((s, b) => s + b.planned, 0) * 100)}%</td>
                            <td colSpan={2} />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}

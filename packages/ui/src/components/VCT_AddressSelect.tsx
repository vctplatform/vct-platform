'use client'
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Card, VCT_Text } from './vct-ui-layout'
import { VCT_Input, VCT_Select, VCT_Field } from './vct-ui-form'

/* ── Types ──────────────────────────────────────────────────── */

export interface ProvinceInfo {
    name: string
    code: number
    division_type: string
    codename: string
    phone_code: number
    ward_count: number
}

export interface Ward {
    name: string
    code: number
    division_type: string
    codename: string
    province_code: number
}

export interface AddressValue {
    provinceCode: number | null
    provinceName: string
    wardCode: number | null
    wardName: string
}

export const emptyAddress: AddressValue = {
    provinceCode: null,
    provinceName: '',
    wardCode: null,
    wardName: '',
}

interface VCT_AddressSelectProps {
    /** Current value */
    value: AddressValue
    /** Called when value changes (e.g. province selected) */
    onProvinceChange: (code: number | null, name: string) => void
    /** Called when ward changes */
    onWardChange: (code: number | null, name: string) => void
    
    /** Data */
    provinces: ProvinceInfo[]
    wards: Ward[]
    
    /** States */
    loadingProvinces?: boolean
    loadingWards?: boolean
    disabled?: boolean
    
    /** Search */
    provinceSearch: string
    onProvinceSearchChange: (val: string) => void
    wardSearch: string
    onWardSearchChange: (val: string) => void
    
    /** Display */
    label?: string
    className?: string
}

/**
 * Pure UI Component for cascading address selection.
 * Decoupled from API fetching.
 */
export function VCT_AddressSelect({
    value,
    onProvinceChange,
    onWardChange,
    provinces,
    wards,
    loadingProvinces = false,
    loadingWards = false,
    disabled = false,
    provinceSearch,
    onProvinceSearchChange,
    wardSearch,
    onWardSearchChange,
    label = 'Địa chỉ hành chính',
    className = '',
}: VCT_AddressSelectProps) {
    const provinceOptions = useMemo(() => [
        { value: '', label: loadingProvinces ? 'Đang tải...' : `-- Chọn tỉnh/TP (${provinces.length}) --` },
        ...provinces.map(p => ({ value: p.code, label: `${p.name} (${p.ward_count} xã/phường)` }))
    ], [provinces, loadingProvinces])

    const wardOptions = useMemo(() => [
        { value: '', label: !value.provinceCode ? '-- Chọn tỉnh/TP trước --' : (loadingWards ? 'Đang tải...' : `-- Chọn xã/phường (${wards.length}) --`) },
        ...wards.map(w => ({ value: w.code, label: w.name }))
    ], [wards, loadingWards, value.provinceCode])

    return (
        <div className={className}>
            <VCT_Field label={label}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Province Selector */}
                    <div className="flex flex-col gap-1">
                        <VCT_Text variant="small" style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>
                            Tỉnh / Thành phố
                        </VCT_Text>
                        <div className="flex flex-col">
                            <VCT_Input
                                placeholder="Tìm tỉnh/TP..."
                                value={provinceSearch}
                                onChange={(e) => onProvinceSearchChange(e.target.value)}
                                disabled={disabled}
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', height: 32, fontSize: 12 }}
                            />
                            <VCT_Select
                                value={value.provinceCode ?? ''}
                                onChange={(val) => {
                                    const code = val ? parseInt(val, 10) : null
                                    const name = provinces.find(p => p.code === code)?.name ?? ''
                                    onProvinceChange(code, name)
                                }}
                                options={provinceOptions}
                                disabled={disabled || loadingProvinces}
                                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                            />
                        </div>
                    </div>

                    {/* Ward Selector */}
                    <div className="flex flex-col gap-1">
                        <VCT_Text variant="small" style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>
                            Xã / Phường / Thị trấn
                        </VCT_Text>
                        <div className="flex flex-col">
                            <VCT_Input
                                placeholder="Tìm xã/phường..."
                                value={wardSearch}
                                onChange={(e) => onWardSearchChange(e.target.value)}
                                disabled={disabled || !value.provinceCode}
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', height: 32, fontSize: 12 }}
                            />
                            <VCT_Select
                                value={value.wardCode ?? ''}
                                onChange={(val) => {
                                    const code = val ? parseInt(val, 10) : null
                                    const name = wards.find(w => w.code === code)?.name ?? ''
                                    onWardChange(code, name)
                                }}
                                options={wardOptions}
                                disabled={disabled || !value.provinceCode || loadingWards}
                                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Selected address preview */}
                {value.provinceCode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 px-3 py-2 rounded-lg"
                        style={{ background: 'var(--vct-bg-tertiary)', border: '1px solid var(--vct-border-subtle)' }}
                    >
                        <VCT_Text variant="small" style={{ margin: 0 }}>
                            📍 {value.wardName ? `${value.wardName}, ` : ''}
                            {value.provinceName}
                        </VCT_Text>
                    </motion.div>
                )}
            </VCT_Field>
        </div>
    )
}

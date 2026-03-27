'use client'
import { useCallback, useState } from 'react'
import { VCT_AddressSelect, type AddressValue, emptyAddress } from '@vct/ui'
import { useProvinces, useWards } from '../hooks/useDivisions'

interface VCTAddressSelectProps {
    /** Current value (controlled mode) */
    value?: AddressValue
    /** Called when address changes */
    onChange?: (value: AddressValue) => void
    /** Whether the component is disabled */
    disabled?: boolean
    /** CSS class for the container */
    className?: string
    /** Label displayed above the component */
    label?: string
}

/**
 * Smart wrapper for VCT_AddressSelect (from @vct/ui).
 * Handles data fetching using useProvinces and useWards hooks.
 */
export function VCTAddressSelect({
    value,
    onChange,
    disabled = false,
    className = '',
    label = 'Địa chỉ hành chính',
}: VCTAddressSelectProps) {
    const [internalValue, setInternalValue] = useState<AddressValue>(emptyAddress)
    const currentValue = value ?? internalValue
    
    const [provinceSearch, setProvinceSearch] = useState('')
    const [wardSearch, setWardSearch] = useState('')

    const { provinces, isLoading: loadingProvinces } = useProvinces(
        provinceSearch.length >= 1 ? provinceSearch : undefined
    )
    const { wards, isLoading: loadingWards } = useWards(
        currentValue.provinceCode,
        wardSearch.length >= 1 ? wardSearch : undefined
    )

    const setValue = useCallback(
        (v: AddressValue) => {
            if (onChange) onChange(v)
            else setInternalValue(v)
        },
        [onChange]
    )

    const handleProvinceChange = useCallback(
        (code: number | null, name: string) => {
            if (code === null) {
                setValue(emptyAddress)
                setWardSearch('')
                return
            }
            setValue({
                provinceCode: code,
                provinceName: name,
                wardCode: null,
                wardName: '',
            })
            setWardSearch('')
        },
        [setValue]
    )

    const handleWardChange = useCallback(
        (code: number | null, name: string) => {
            if (code === null) {
                setValue({
                    ...currentValue,
                    wardCode: null,
                    wardName: '',
                })
                return
            }
            setValue({
                ...currentValue,
                wardCode: code,
                wardName: name,
            })
        },
        [currentValue, setValue]
    )

    return (
        <VCT_AddressSelect
            value={currentValue}
            onProvinceChange={handleProvinceChange}
            onWardChange={handleWardChange}
            provinces={provinces}
            wards={wards}
            loadingProvinces={loadingProvinces}
            loadingWards={loadingWards}
            disabled={disabled}
            provinceSearch={provinceSearch}
            onProvinceSearchChange={setProvinceSearch}
            wardSearch={wardSearch}
            onWardSearchChange={setWardSearch}
            label={label}
            className={className}
        />
    )
}

export { emptyAddress }
export type { AddressValue }

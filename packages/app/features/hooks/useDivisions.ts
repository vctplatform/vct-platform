'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../data/api-client'

// ── Types ────────────────────────────────────────────────────

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

interface ApiListResponse<T> {
    count: number
    data: T[]
}

// ── Hooks ────────────────────────────────────────────────────

/**
 * Hook to fetch and search provinces.
 * Results are cached after first load.
 */
export function useProvinces(searchQuery?: string) {
    const [provinces, setProvinces] = useState<ProvinceInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const cacheRef = useRef<ProvinceInfo[] | null>(null)

    const fetchProvinces = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            // Use cached data for non-search queries
            if (!searchQuery && cacheRef.current) {
                setProvinces(cacheRef.current)
                setIsLoading(false)
                return
            }

            const params = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
            const result = await apiClient.get<ApiListResponse<ProvinceInfo>>(
                `/api/v1/divisions/provinces${params}`
            )
            const data = result.data ?? []
            if (!searchQuery) {
                cacheRef.current = data
            }
            setProvinces(data)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery])

    useEffect(() => {
        fetchProvinces()
    }, [fetchProvinces])

    return { provinces, isLoading, error, refetch: fetchProvinces }
}

/**
 * Hook to fetch wards for a specific province.
 * Automatically refetches when provinceCode changes.
 */
export function useWards(provinceCode: number | null, searchQuery?: string) {
    const [wards, setWards] = useState<Ward[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const wardCacheRef = useRef<Map<number, Ward[]>>(new Map())

    const fetchWards = useCallback(async () => {
        if (provinceCode === null || provinceCode === undefined) {
            setWards([])
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            // Use cache for non-search queries
            if (!searchQuery && wardCacheRef.current.has(provinceCode)) {
                setWards(wardCacheRef.current.get(provinceCode) ?? [])
                setIsLoading(false)
                return
            }

            const params = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
            const result = await apiClient.get<ApiListResponse<Ward>>(
                `/api/v1/divisions/provinces/${provinceCode}/wards${params}`
            )
            const data = result.data ?? []
            if (!searchQuery) {
                wardCacheRef.current.set(provinceCode, data)
            }
            setWards(data)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
            setIsLoading(false)
        }
    }, [provinceCode, searchQuery])

    useEffect(() => {
        fetchWards()
    }, [fetchWards])

    return { wards, isLoading, error, refetch: fetchWards }
}

// ── Address Value ────────────────────────────────────────────

export { emptyAddress } from '@vct/ui'
export type { AddressValue } from '@vct/ui'

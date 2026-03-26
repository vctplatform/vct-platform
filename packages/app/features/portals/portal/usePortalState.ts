'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — State hook
// Manages search, sort, view mode, and category expand states.
// ════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { WorkspaceCard, WorkspaceCategory } from '../../layout/workspace-types'
import { WORKSPACE_CATEGORIES, getCategoryForType } from '../../layout/workspace-types'
import { useWorkspaceStore } from '../../layout/workspace-store'

// ── Vietnamese diacritics normalization ──
export function normalizeVietnamese(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
}

export type SortMode = 'az' | 'recent' | 'pending'
export type ViewMode = 'grid' | 'list'

const VIEW_MODE_KEY = 'vct-portal-view-mode'

export interface PortalCategoryGroup {
    category: WorkspaceCategory
    label: string
    icon: string
    color: string
    cards: WorkspaceCard[]
}

export function usePortalState(workspaces: WorkspaceCard[]) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // ── Search ──
    const initialQuery = searchParams?.get('q') ?? ''
    const [searchQuery, setSearchQuery] = useState(initialQuery)

    // Sync search to URL (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams?.toString() ?? '')
            if (searchQuery) {
                params.set('q', searchQuery)
            } else {
                params.delete('q')
            }
            const qs = params.toString()
            router.replace(qs ? `?${qs}` : '/', { scroll: false })
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, router, searchParams])

    // ── Sort ──
    const [sortMode, setSortMode] = useState<SortMode>('recent')

    // ── View mode (persisted) ──
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null
        if (stored === 'grid' || stored === 'list') setViewMode(stored)
    }, [])
    const handleSetViewMode = useCallback((mode: ViewMode) => {
        setViewMode(mode)
        if (typeof window !== 'undefined') localStorage.setItem(VIEW_MODE_KEY, mode)
    }, [])

    // ── Category expand states ──
    const [expandedCategories, setExpandedCategories] = useState<Set<WorkspaceCategory>>(new Set())
    const toggleCategory = useCallback((cat: WorkspaceCategory) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev)
            if (next.has(cat)) next.delete(cat)
            else next.add(cat)
            return next
        })
    }, [])

    // ── Store data ──
    const { 
        pinnedWorkspaceIds, 
        lastAccessedMap,
        activeCategory,
        setActiveCategory 
    } = useWorkspaceStore()

    // ── Search-Filtered workspaces (for Tab counts) ──
    const searchFilteredCards = useMemo(() => {
        let cards = [...workspaces]

        // Search filter (diacritics-aware)
        if (searchQuery) {
            const normalizedQuery = normalizeVietnamese(searchQuery)
            cards = cards.filter((card) => {
                const name = normalizeVietnamese(card.label)
                const desc = normalizeVietnamese(card.description)
                const scopeName = normalizeVietnamese(card.scope.name)
                return (
                    name.includes(normalizedQuery) ||
                    desc.includes(normalizedQuery) ||
                    scopeName.includes(normalizedQuery)
                )
            })
        }
        return cards
    }, [workspaces, searchQuery])

    // ── Tab Counts ──
    const categoryCounts = useMemo(() => {
        const counts = {} as Record<WorkspaceCategory, number>
        for (const cat of Object.keys(WORKSPACE_CATEGORIES) as WorkspaceCategory[]) {
            counts[cat] = 0
        }
        for (const card of searchFilteredCards) {
            const cat = getCategoryForType(card.type)
            counts[cat] = (counts[cat] || 0) + 1
        }
        return counts
    }, [searchFilteredCards])

    // ── Final Filtered + Sorted workspaces (for Unified Grid) ──
    const filteredCards = useMemo(() => {
        let cards = [...searchFilteredCards]

        // Category filter
        if (activeCategory) {
            cards = cards.filter((c) => getCategoryForType(c.type) === activeCategory)
        }

        // Sort
        switch (sortMode) {
            case 'az':
                cards.sort((a, b) => a.label.localeCompare(b.label, 'vi'))
                break
            case 'recent':
                cards.sort((a, b) => (lastAccessedMap[b.id] ?? 0) - (lastAccessedMap[a.id] ?? 0))
                break
            case 'pending':
                cards.sort((a, b) => (b.pendingActions ?? 0) - (a.pendingActions ?? 0))
                break
        }

        return cards
    }, [searchFilteredCards, activeCategory, sortMode, lastAccessedMap])

    // ── Pinned workspaces ──
    const pinnedCards = useMemo(
        () => workspaces.filter((c) => pinnedWorkspaceIds.includes(c.id)),
        [workspaces, pinnedWorkspaceIds]
    )

    // ── Recent workspaces ──
    const [fetchedRecentIds, setFetchedRecentIds] = useState<string[] | null>(null)

    useEffect(() => {
        let mounted = true
        async function fetchRecent() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
                const res = await fetch(`${apiUrl}/api/v1/portal/recent-workspaces`)
                if (res.ok) {
                    const data = await res.json()
                    // Assuming data.items is an array of { id: string, lastAccessedAt: string }
                    if (mounted) {
                        setFetchedRecentIds(data.items.map((item: any) => item.id))
                    }
                }
            } catch (err) {
                // Ignore fallback to local Zustand store
            }
        }
        fetchRecent()
        return () => { mounted = false }
    }, [])

    const recentCards = useMemo(() => {
        if (fetchedRecentIds) {
            return fetchedRecentIds
                .map(id => workspaces.find(w => w.id === id))
                .filter((c): c is WorkspaceCard => c != null)
                .slice(0, 5)
        }
        // Fallback to local tracking
        return workspaces
            .filter((c) => lastAccessedMap[c.id] != null)
            .sort((a, b) => (lastAccessedMap[b.id] ?? 0) - (lastAccessedMap[a.id] ?? 0))
            .slice(0, 5)
    }, [workspaces, lastAccessedMap, fetchedRecentIds])

    return {
        // Search
        searchQuery,
        setSearchQuery,
        // Sort
        sortMode,
        setSortMode,
        // View
        viewMode,
        setViewMode: handleSetViewMode,
        // Categories
        activeCategory,
        setActiveCategory,
        categoryCounts,
        expandedCategories,
        toggleCategory,
        // Data
        filteredCards,
        searchFilteredCards,
        pinnedCards,
        recentCards,
        // Totals
        totalCount: workspaces.length,
        filteredCount: filteredCards.length,
    }
}

'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EntityRepository } from './entity-repository'
import { createInitialUIState } from './ui-state'
import { subscribeToEntityRealtime } from './realtime-client'

export const useEntityCollection = <T extends { id: string }>(
  repository: EntityRepository<T>
) => {
  const [items, setItems] = useState<T[]>([])
  const [uiState, setUiState] = useState(createInitialUIState)
  const itemsRef = useRef<T[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const load = useCallback(async () => {
    setUiState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const rows = await repository.list()
      setItems(rows)
      setUiState((prev) => ({ ...prev, loading: false }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu'
      setUiState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }, [repository])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (repository.mode !== 'api' || !repository.entityName) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = subscribeToEntityRealtime(repository.entityName, () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        void load()
      }, 120)
    })

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      unsubscribe()
    }
  }, [load, repository.entityName, repository.mode])

  // ── Optimistic CRUD ──────────────────────────────────────────

  const create = useCallback(
    async (item: T) => {
      const previous = itemsRef.current
      // Optimistic: add immediately
      setItems((prev) => [...prev, item])
      try {
        const created = await repository.create(item)
        // Replace optimistic item with server response
        setItems((prev) => prev.map((i) => (i.id === item.id ? created : i)))
        return created
      } catch (error) {
        // Rollback on failure
        setItems(previous)
        const message = error instanceof Error ? error.message : 'Không thể tạo mới'
        setUiState((prev) => ({ ...prev, error: message }))
        throw error
      }
    },
    [repository]
  )

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const previous = itemsRef.current
      // Optimistic: apply patch immediately
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      )
      try {
        const updated = await repository.update(id, patch)
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
        return updated
      } catch (error) {
        setItems(previous)
        const message = error instanceof Error ? error.message : 'Không thể cập nhật'
        setUiState((prev) => ({ ...prev, error: message }))
        throw error
      }
    },
    [repository]
  )

  const remove = useCallback(
    async (id: string) => {
      const previous = itemsRef.current
      // Optimistic: remove immediately
      setItems((prev) => prev.filter((item) => item.id !== id))
      try {
        await repository.remove(id)
      } catch (error) {
        setItems(previous)
        const message = error instanceof Error ? error.message : 'Không thể xóa'
        setUiState((prev) => ({ ...prev, error: message }))
        throw error
      }
    },
    [repository]
  )

  const replaceAll = useCallback(
    async (next: T[]) => {
      const previous = itemsRef.current
      setItems(next)
      try {
        await repository.replaceAll(next)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể lưu dữ liệu'
        setItems(previous)
        setUiState((prev) => ({ ...prev, error: message }))
      }
    },
    [repository]
  )

  const helpers = useMemo(
    () => ({
      load,
      create,
      update,
      remove,
      replaceAll,
      setSuccessMessage: (message: string | null) =>
        setUiState((prev) => ({ ...prev, successMessage: message })),
      clearError: () => setUiState((prev) => ({ ...prev, error: null })),
    }),
    [load, create, update, remove, replaceAll]
  )

  return {
    items,
    setItems,
    uiState,
    ...helpers,
  }
}

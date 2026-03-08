'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EntityRepository } from './entity-repository'
import { createInitialUIState } from './ui-state'

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
      replaceAll,
      setSuccessMessage: (message: string | null) =>
        setUiState((prev) => ({ ...prev, successMessage: message })),
      clearError: () => setUiState((prev) => ({ ...prev, error: null })),
    }),
    [load, replaceAll]
  )

  return {
    items,
    setItems,
    uiState,
    ...helpers,
  }
}

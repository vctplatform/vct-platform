export interface UIState {
  loading: boolean
  error: string | null
  successMessage: string | null
}

export interface ListUIState extends UIState {
  search: string
  page: number
  pageSize: number
  sort: string | null
  filters: Record<string, string | number | boolean | null>
}

export const createInitialUIState = (): UIState => ({
  loading: false,
  error: null,
  successMessage: null,
})

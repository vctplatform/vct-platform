export type ExportFormat = 'json' | 'csv'

export interface ImportReport<T> {
  imported: T[]
  rejected: Array<{ item: unknown; reason: string }>
}

export interface EntityRepository<T extends { id: string }> {
  list: () => Promise<T[]>
  getById: (id: string) => Promise<T | undefined>
  create: (item: T) => Promise<T>
  update: (id: string, patch: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
  replaceAll: (items: T[]) => Promise<T[]>
  importItems: (items: unknown[]) => Promise<ImportReport<T>>
  exportItems: (format: ExportFormat) => Promise<string>
}

const memoryStore = new Map<string, string>()

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readStore = (key: string) => {
  if (canUseStorage()) return window.localStorage.getItem(key)
  return memoryStore.get(key) ?? null
}

const writeStore = (key: string, value: string) => {
  if (canUseStorage()) {
    window.localStorage.setItem(key, value)
    return
  }
  memoryStore.set(key, value)
}

const csvEscape = (value: unknown) => {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const toCsv = <T extends Record<string, unknown>>(items: T[]) => {
  if (items.length === 0) return ''
  const headers = Object.keys(items[0] ?? {})
  const rows = items.map((item) =>
    headers.map((header) => csvEscape(item[header])).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export const createMockAdapter = <T extends { id: string }>(
  storageKey: string,
  seed: T[],
  validate: (item: unknown) => item is T
): EntityRepository<T> => {
  const ensureSeed = () => {
    const raw = readStore(storageKey)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as T[]
        if (Array.isArray(parsed)) return parsed
      } catch {
        // ignore invalid storage, re-seed below
      }
    }
    const seeded = clone(seed)
    writeStore(storageKey, JSON.stringify(seeded))
    return seeded
  }

  const persist = (items: T[]) => {
    writeStore(storageKey, JSON.stringify(items))
    return clone(items)
  }

  return {
    async list() {
      return clone(ensureSeed())
    },
    async getById(id: string) {
      return ensureSeed().find((item) => item.id === id)
    },
    async create(item: T) {
      const items = ensureSeed()
      if (items.some((current) => current.id === item.id)) {
        throw new Error(`Trùng ID: ${item.id}`)
      }
      persist([...items, clone(item)])
      return clone(item)
    },
    async update(id: string, patch: Partial<T>) {
      const items = ensureSeed()
      const index = items.findIndex((item) => item.id === id)
      if (index < 0) throw new Error(`Không tìm thấy bản ghi: ${id}`)
      const current = items[index] as T
      const next = { ...current, ...patch } as T
      const updated = [...items]
      updated[index] = next
      persist(updated)
      return clone(next)
    },
    async remove(id: string) {
      const items = ensureSeed()
      persist(items.filter((item) => item.id !== id))
    },
    async replaceAll(items: T[]) {
      return persist(items.map((item) => clone(item)))
    },
    async importItems(payload: unknown[]) {
      const imported: T[] = []
      const rejected: Array<{ item: unknown; reason: string }> = []
      payload.forEach((item) => {
        if (validate(item)) {
          imported.push(item)
        } else {
          rejected.push({ item, reason: 'Sai định dạng dữ liệu' })
        }
      })

      if (imported.length > 0) {
        const current = ensureSeed()
        const byId = new Map(current.map((item) => [item.id, item] as const))
        imported.forEach((item) => byId.set(item.id, item))
        persist(Array.from(byId.values()))
      }

      return { imported, rejected }
    },
    async exportItems(format: ExportFormat) {
      const items = ensureSeed() as Array<Record<string, unknown>>
      if (format === 'csv') return toCsv(items)
      return JSON.stringify(items, null, 2)
    },
  }
}

export const createApiAdapter = <T extends { id: string }>(
  entityName: string
): EntityRepository<T> => {
  const fail = async () => {
    throw new Error(
      `ApiAdapter cho "${entityName}" chưa được cấu hình endpoint.`
    )
  }

  return {
    list: fail,
    getById: fail,
    create: fail,
    update: fail,
    remove: fail,
    replaceAll: fail,
    importItems: fail,
    exportItems: fail,
  }
}

export type ExportFormat = 'json' | 'csv'

export interface ImportReport<T> {
  imported: T[]
  rejected: Array<{ item: unknown; reason: string }>
}

export interface EntityRepository<T extends { id: string }> {
  entityName?: string
  mode?: 'mock' | 'api'
  list: () => Promise<T[]>
  getById: (id: string) => Promise<T | undefined>
  create: (item: T) => Promise<T>
  update: (id: string, patch: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
  replaceAll: (items: T[]) => Promise<T[]>
  importItems: (items: unknown[]) => Promise<ImportReport<T>>
  exportItems: (format: ExportFormat) => Promise<string>
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiEndpointMap {
  list?: string
  getById?: string
  create?: string
  update?: string
  remove?: string
  replaceAll?: string
  importItems?: string
  exportItems?: string
}

export interface ApiAdapterConfig {
  baseUrl?: string
  headers?: Record<string, string>
  getAuthToken?: () => string | null | undefined
  endpoints?: ApiEndpointMap
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
    entityName: storageKey,
    mode: 'mock',
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
  entityName: string,
  config: ApiAdapterConfig = {}
): EntityRepository<T> => {
  const baseUrl = config.baseUrl ?? '/api/v1'
  const endpointMap: Required<ApiEndpointMap> = {
    list: config.endpoints?.list ?? '/{entity}',
    getById: config.endpoints?.getById ?? '/{entity}/{id}',
    create: config.endpoints?.create ?? '/{entity}',
    update: config.endpoints?.update ?? '/{entity}/{id}',
    remove: config.endpoints?.remove ?? '/{entity}/{id}',
    replaceAll: config.endpoints?.replaceAll ?? '/{entity}/bulk',
    importItems: config.endpoints?.importItems ?? '/{entity}/import',
    exportItems: config.endpoints?.exportItems ?? '/{entity}/export',
  }

  const resolvePath = (
    template: string,
    params: Record<string, string | number | undefined> = {}
  ) =>
    template
      .replace('{entity}', entityName)
      .replace('{id}', encodeURIComponent(String(params.id ?? '')))

  const responseCache = new Map<string, { expiresAt: number; value: unknown }>()
  const cacheTTL = 15 * 1000

  const cacheKey = (method: HttpMethod, path: string, query = '') =>
    `${method}:${path}${query}`

  const readCache = <R>(key: string): R | null => {
    const hit = responseCache.get(key)
    if (!hit) return null
    if (hit.expiresAt <= Date.now()) {
      responseCache.delete(key)
      return null
    }
    return clone(hit.value as R)
  }

  const writeCache = <R>(key: string, value: R) => {
    responseCache.set(key, {
      expiresAt: Date.now() + cacheTTL,
      value: clone(value),
    })
  }

  const invalidateCache = () => {
    responseCache.clear()
  }

  const request = async <R>(
    method: HttpMethod,
    path: string,
    options: {
      body?: unknown
      query?: Record<string, string>
      parseAs?: 'json' | 'text'
    } = {}
  ): Promise<R> => {
    const token = config.getAuthToken?.()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config.headers,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const query = options.query
      ? `?${new URLSearchParams(options.query).toString()}`
      : ''
    const key = cacheKey(method, path, query)
    const isCacheable = method === 'GET' && options.parseAs !== 'text'

    if (isCacheable) {
      const cached = readCache<R>(key)
      if (cached !== null) {
        return cached
      }
    }

    const response = await fetch(`${baseUrl}${path}${query}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    })

    if (!response.ok) {
      let reason = response.statusText
      try {
        const payload = (await response.json()) as { message?: string }
        if (payload?.message) reason = payload.message
      } catch {
        // fallback to status text
      }
      throw new Error(
        `ApiAdapter "${entityName}" lỗi ${response.status}: ${reason}`
      )
    }

    if (options.parseAs === 'text') {
      return (await response.text()) as R
    }
    if (response.status === 204) {
      return undefined as R
    }
    const payload = (await response.json()) as R
    if (isCacheable) {
      writeCache(key, payload)
    }
    return payload
  }

  return {
    entityName,
    mode: 'api',
    async list() {
      return request<T[]>('GET', resolvePath(endpointMap.list))
    },
    async getById(id: string) {
      return request<T | undefined>('GET', resolvePath(endpointMap.getById, { id }))
    },
    async create(item: T) {
      const created = await request<T>('POST', resolvePath(endpointMap.create), {
        body: item,
      })
      invalidateCache()
      return created
    },
    async update(id: string, patch: Partial<T>) {
      const updated = await request<T>('PATCH', resolvePath(endpointMap.update, { id }), {
        body: patch,
      })
      invalidateCache()
      return updated
    },
    async remove(id: string) {
      await request<void>('DELETE', resolvePath(endpointMap.remove, { id }), {
        parseAs: 'text',
      })
      invalidateCache()
    },
    async replaceAll(items: T[]) {
      const rows = await request<T[]>('PUT', resolvePath(endpointMap.replaceAll), {
        body: { items },
      })
      invalidateCache()
      return rows
    },
    async importItems(payload: unknown[]) {
      const report = await request<ImportReport<T>>(
        'POST',
        resolvePath(endpointMap.importItems),
        {
          body: { items: payload },
        }
      )
      invalidateCache()
      return report
    },
    async exportItems(format: ExportFormat) {
      return request<string>('GET', resolvePath(endpointMap.exportItems), {
        query: { format },
        parseAs: 'text',
      })
    },
  }
}

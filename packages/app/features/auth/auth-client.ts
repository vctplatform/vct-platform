import type {
  AuthAuditEntry,
  AuthSession,
  AuthUser,
  LoginInput,
  RevokeInput,
} from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:18080'

export class AuthClientError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthClientError'
    this.status = status
  }
}

export const isAuthClientError = (error: unknown): error is AuthClientError =>
  error instanceof AuthClientError

interface BackendAuthUser {
  user: {
    id: string
    username: string
    displayName: string
    role: AuthUser['role']
  }
}

interface BackendTokenResponse {
  token?: string
  accessToken?: string
  refreshToken?: string
  tokenType?: 'Bearer'
  expiresAt?: string
  refreshExpiresAt?: string
}

interface BackendLoginResponse extends BackendAuthUser, BackendTokenResponse {
  tournamentCode?: string
  operationShift?: 'sang' | 'chieu' | 'toi'
}

interface BackendMeResponse extends BackendAuthUser, Partial<BackendTokenResponse> {
  tournamentCode?: string
  operationShift?: 'sang' | 'chieu' | 'toi'
}

interface BackendAuditResponse {
  items: AuthAuditEntry[]
  count: number
}

interface AuthMeResult {
  user: AuthUser
  tournamentCode: string
  operationShift: 'sang' | 'chieu' | 'toi'
  expiresAt: string
  refreshExpiresAt: string
}

const toAuthUser = (payload: BackendLoginResponse['user']): AuthUser => ({
  id: payload.id,
  username: payload.username,
  name: payload.displayName,
  role: payload.role,
})

const normalizeShift = (
  value: string | undefined
): 'sang' | 'chieu' | 'toi' => {
  if (value === 'chieu' || value === 'toi') return value
  return 'sang'
}

const parseError = async (response: Response): Promise<string> => {
  const fallback = `HTTP ${response.status}`
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text().catch(() => '')
    return text.trim() || fallback
  }

  try {
    const payload = (await response.json()) as { message?: string }
    return payload?.message?.trim() || fallback
  } catch {
    return fallback
  }
}

const requestJson = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    throw new AuthClientError(await parseError(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

const toSession = (
  payload: BackendLoginResponse,
  fallback: Pick<LoginInput, 'operationShift' | 'tournamentCode'>
): AuthSession => {
  const accessToken = payload.accessToken ?? payload.token ?? ''
  const refreshToken = payload.refreshToken ?? ''
  if (!accessToken || !refreshToken) {
    throw new AuthClientError('Backend không trả đủ access/refresh token.', 500)
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    tokenType: payload.tokenType ?? 'Bearer',
    user: toAuthUser(payload.user),
    tournamentCode: payload.tournamentCode ?? fallback.tournamentCode,
    operationShift: normalizeShift(payload.operationShift ?? fallback.operationShift),
    expiresAt:
      payload.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshExpiresAt:
      payload.refreshExpiresAt ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export const authClient = {
  baseUrl: API_BASE_URL,
  async login(input: LoginInput): Promise<AuthSession> {
    const payload = await requestJson<BackendLoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    })
    return toSession(payload, input)
  },

  async me(accessToken: string): Promise<AuthMeResult> {
    const payload = await requestJson<BackendMeResponse>('/api/v1/auth/me', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return {
      user: toAuthUser(payload.user),
      tournamentCode: payload.tournamentCode ?? 'VCT-2026',
      operationShift: normalizeShift(payload.operationShift),
      expiresAt:
        payload.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refreshExpiresAt:
        payload.refreshExpiresAt ??
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },

  async refresh(
    refreshToken: string,
    fallback: Pick<LoginInput, 'operationShift' | 'tournamentCode'>
  ): Promise<AuthSession> {
    const payload = await requestJson<BackendLoginResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    return toSession(payload, fallback)
  },

  async logout(accessToken: string): Promise<void> {
    if (!accessToken) return
    await requestJson<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
  },

  async revoke(accessToken: string, input: RevokeInput): Promise<number> {
    const payload = await requestJson<{ revokedCount?: number }>(
      '/api/v1/auth/revoke',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(input),
      }
    )
    return Number(payload.revokedCount ?? 0)
  },

  async getAuditLogs(
    accessToken: string,
    query: { limit?: number; actor?: string; action?: string } = {}
  ): Promise<BackendAuditResponse> {
    const params = new URLSearchParams()
    if (query.limit && Number.isFinite(query.limit)) {
      params.set('limit', String(query.limit))
    }
    if (query.actor) {
      params.set('actor', query.actor)
    }
    if (query.action) {
      params.set('action', query.action)
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : ''
    return requestJson<BackendAuditResponse>(`/api/v1/auth/audit${suffix}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
  },
}

'use client'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

/**
 * Typed API client with auth token injection, retry logic, and error handling.
 * Replaces raw fetch() calls across the codebase with a consistent pattern.
 */

export class ApiClientError extends Error {
    readonly status: number
    readonly code?: string

    constructor(message: string, status: number, code?: string) {
        super(message)
        this.name = 'ApiClientError'
        this.status = status
        this.code = code
    }
}

interface ApiErrorPayload {
    message?: string
    code?: string
}

const parseErrorResponse = async (
    response: Response
): Promise<{ message: string; code?: string }> => {
    const fallback = `HTTP ${response.status}`
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('application/json')) {
        const text = await response.text().catch(() => '')
        return { message: text.trim() || fallback }
    }
    try {
        const payload = (await response.json()) as ApiErrorPayload
        return {
            message: payload?.message?.trim() || fallback,
            code: payload?.code,
        }
    } catch {
        return { message: fallback }
    }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    token?: string
    body?: unknown
    retries?: number
    retryDelayMs?: number
}

const request = async <T>(
    path: string,
    options: RequestOptions = {}
): Promise<T> => {
    const { token, body, retries = 2, retryDelayMs = 500, ...init } = options
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_BASE_URL}${path}`, {
                ...init,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            })

            if (!response.ok) {
                const { message, code } = await parseErrorResponse(response)
                throw new ApiClientError(message, response.status, code)
            }

            if (response.status === 204) {
                return undefined as T
            }

            return (await response.json()) as T
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))

            // Don't retry client errors (4xx)
            if (error instanceof ApiClientError && error.status < 500) {
                throw error
            }

            // Wait before retry (skip for last attempt)
            if (attempt < retries) {
                await new Promise((resolve) =>
                    setTimeout(resolve, retryDelayMs * (attempt + 1))
                )
            }
        }
    }

    throw lastError ?? new Error('Request failed')
}

export const apiClient = {
    baseUrl: API_BASE_URL,

    get<T>(path: string, token?: string): Promise<T> {
        return request<T>(path, { method: 'GET', token })
    },

    post<T>(path: string, body: unknown, token?: string): Promise<T> {
        return request<T>(path, { method: 'POST', body, token })
    },

    patch<T>(path: string, body: unknown, token?: string): Promise<T> {
        return request<T>(path, { method: 'PATCH', body, token })
    },

    put<T>(path: string, body: unknown, token?: string): Promise<T> {
        return request<T>(path, { method: 'PUT', body, token })
    },

    delete<T = void>(path: string, token?: string): Promise<T> {
        return request<T>(path, { method: 'DELETE', token })
    },
}

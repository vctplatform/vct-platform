import type { AuthUser } from '../auth/types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile API Client
// Typed HTTP client for athlete-related backend REST endpoints.
// Uses same pattern as auth-client.ts (requestJson + error handling)
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function requestJson<T>(
  path: string,
  token: string | null,
  init: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    let msg = `HTTP ${response.status}`
    if (contentType.includes('application/json')) {
      try {
        const body = (await response.json()) as { message?: string }
        msg = body?.message?.trim() || msg
      } catch { /* ignore */ }
    }
    throw new ApiError(msg, response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// ── Types ────────────────────────────────────────────────────

export interface AthleteProfileAPI {
  id: string
  userId?: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  email?: string
  clubId?: string
  clubName?: string
  beltRank?: string
  eloRating?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TrainingSessionAPI {
  id: string
  athleteId: string
  type: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  coach?: string
  status: string
  notes?: string
}

export interface AttendanceStatsAPI {
  total: number
  attended: number
  absent: number
  cancelled: number
  streak: number
  rate: number
}

export interface TournamentEntryAPI {
  id: string
  athleteId: string
  tournamentId: string
  tournamentName?: string
  category?: string
  weightClass?: string
  status: string
  registeredAt?: string
  documents?: Record<string, boolean>
  notes?: string
}

export interface ProfileStatsAPI {
  totalAthletes: number
  activeAthletes: number
  totalClubs: number
}

export interface MatchResultAPI {
  id: string
  athleteId: string
  tournamentId?: string
  tournamentName: string
  category: string
  result: string // HCV, HCB, HCĐ, Tứ kết, etc.
  medal?: 'gold' | 'silver' | 'bronze' | null
  opponentName?: string
  score?: string
  date: string
}

export interface MedalSummaryAPI {
  gold: number
  silver: number
  bronze: number
  total: number
}

export interface ResultsSummaryAPI {
  results: MatchResultAPI[]
  medals: MedalSummaryAPI
  eloRating: number
  totalTournaments: number
}

export interface RankingEntryAPI {
  scope: string   // 'national' | 'regional' | 'city'
  label: string
  rank: number
  trend: number   // positive = up, negative = down, 0 = stable
}

export interface RankingsDataAPI {
  rankings: RankingEntryAPI[]
  eloHistory: number[]  // last N elo snapshots for sparkline
}

export interface NotificationAPI {
  id: string
  type: 'tournament' | 'training' | 'system' | 'result'
  title: string
  body: string
  time: string
  read: boolean
  createdAt?: string
}

// ── API Functions ────────────────────────────────────────────

/** Get current user's athlete profile */
export async function fetchMyProfile(token: string | null): Promise<AthleteProfileAPI> {
  return requestJson<AthleteProfileAPI>('/api/v1/athlete-profiles/me', token)
}

/** Update athlete profile */
export async function updateProfile(
  token: string | null,
  profileId: string,
  patch: Partial<AthleteProfileAPI>
): Promise<AthleteProfileAPI> {
  return requestJson<AthleteProfileAPI>(
    `/api/v1/athlete-profiles/${profileId}`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }
  )
}

/** List training sessions for an athlete */
export async function fetchTrainingSessions(
  token: string | null,
  athleteId: string
): Promise<TrainingSessionAPI[]> {
  return requestJson<TrainingSessionAPI[]>(
    `/api/v1/training-sessions?athleteId=${encodeURIComponent(athleteId)}`,
    token
  )
}

/** Get training attendance stats */
export async function fetchTrainingStats(
  token: string | null,
  athleteId: string
): Promise<AttendanceStatsAPI> {
  return requestJson<AttendanceStatsAPI>(
    `/api/v1/training-sessions/stats?athleteId=${encodeURIComponent(athleteId)}`,
    token
  )
}

/** List tournament entries for an athlete */
export async function fetchTournamentEntries(
  token: string | null,
  athleteId: string
): Promise<TournamentEntryAPI[]> {
  return requestJson<TournamentEntryAPI[]>(
    `/api/v1/tournament-entries?athleteId=${encodeURIComponent(athleteId)}`,
    token
  )
}

/** Register for a tournament */
export async function registerTournament(
  token: string | null,
  entry: Omit<TournamentEntryAPI, 'id' | 'registeredAt' | 'status'>
): Promise<TournamentEntryAPI> {
  return requestJson<TournamentEntryAPI>(
    '/api/v1/tournament-entries',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }
  )
}

/** Fetch match results & medal summary for an athlete */
export async function fetchMatchResults(
  token: string | null,
  athleteId: string
): Promise<ResultsSummaryAPI> {
  return requestJson<ResultsSummaryAPI>(
    `/api/v1/match-results?athleteId=${encodeURIComponent(athleteId)}`,
    token
  )
}

/** Fetch ranking positions for an athlete */
export async function fetchAthleteRankings(
  token: string | null,
  athleteId: string
): Promise<RankingsDataAPI> {
  return requestJson<RankingsDataAPI>(
    `/api/v1/rankings?athleteId=${encodeURIComponent(athleteId)}`,
    token
  )
}

/** Fetch notifications for current user */
export async function fetchNotificationsAPI(
  token: string | null
): Promise<NotificationAPI[]> {
  return requestJson<NotificationAPI[]>('/api/v1/notifications', token)
}

/** Mark a notification as read */
export async function markNotificationRead(
  token: string | null,
  notificationId: string
): Promise<void> {
  return requestJson<void>(
    `/api/v1/notifications/${notificationId}/read`,
    token,
    { method: 'POST' }
  )
}

/** Upload a document file */
export async function uploadDocument(
  token: string | null,
  tournamentEntryId: string,
  docType: string,
  fileUri: string,
  fileName: string
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('tournamentEntryId', tournamentEntryId)
  formData.append('docType', docType)
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!response.ok) throw new ApiError(`Upload failed: HTTP ${response.status}`, response.status)
  return (await response.json()) as { url: string }
}

/** Get overall athlete stats (admin view) */
export async function fetchAthleteStats(token: string | null): Promise<ProfileStatsAPI> {
  return requestJson<ProfileStatsAPI>('/api/v1/athlete-profiles/stats', token)
}

/** Check if real API is available by testing the base URL */
export function isApiAvailable(): boolean {
  return API_BASE_URL.length > 0
}

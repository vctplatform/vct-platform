import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  fetchMyProfile,
  fetchTrainingSessions,
  fetchTrainingStats,
  fetchTournamentEntries,
  fetchMatchResults,
  fetchAthleteRankings,
  fetchNotificationsAPI,
  isApiAvailable,
  type AthleteProfileAPI,
  type TrainingSessionAPI,
  type AttendanceStatsAPI,
  type TournamentEntryAPI,
  type ResultsSummaryAPI,
  type RankingsDataAPI,
  type NotificationAPI,
} from './api-client'
import {
  MOCK_SKILLS, MOCK_GOALS, MOCK_BELT_HISTORY,
  MOCK_TOURNAMENTS, MOCK_TRAINING, MOCK_RESULTS,
  MOCK_ATTENDANCE_STATS, MOCK_MEDALS, MOCK_NOTIFICATIONS,
  MOCK_RANKINGS, MOCK_ELO_HISTORY,
  type MockSkill, type MockGoal, type MockBelt,
  type MockTournament, type MockTraining, type MockResult,
  type MockNotification, type MockRanking,
} from './mock-data'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile API Hooks (v3)
// Data-fetching hooks with loading/error states.
// Uses real API when available, falls back to mock data.
// ═══════════════════════════════════════════════════════════════

/** Generic async data hook */
function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setIsLoading(true)
    setError(null)
    fetcher()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Có lỗi xảy ra'))
      .finally(() => setIsLoading(false))
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refetch() }, [refetch])

  return { data, isLoading, error, refetch }
}

/** Simulate network delay for mock data */
function mockDelay<T>(data: T, ms = 600): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

/** Try real API first, fall back to mock on error or when API unavailable */
async function withMockFallback<T>(apiFn: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> {
  if (!isApiAvailable()) return mockFn()
  try {
    return await apiFn()
  } catch {
    // Fallback to mock data when API fails
    return mockFn()
  }
}

// ── Athlete Profile ──

export interface AthleteProfileData {
  id?: string
  name: string; club: string; belt: string; elo: number
  isActive: boolean; tournamentCount: number; medalCount: number; attendanceRate: number
  skills: MockSkill[]; goals: MockGoal[]; beltHistory: MockBelt[]
  email?: string; phone?: string; gender?: string; dateOfBirth?: string
}

const MOCK_PROFILE: AthleteProfileData = {
  name: 'VĐV Demo', club: 'CLB Tân Bình', belt: 'Lam đai 3', elo: 1450,
  isActive: true, tournamentCount: 12, medalCount: 5, attendanceRate: 87,
  skills: MOCK_SKILLS, goals: MOCK_GOALS, beltHistory: MOCK_BELT_HISTORY,
}

function mapApiProfile(api: AthleteProfileAPI): AthleteProfileData {
  return {
    id: api.id,
    name: api.fullName || 'VĐV',
    club: api.clubName || 'Chưa có CLB',
    belt: api.beltRank || 'Chưa xếp đai',
    elo: api.eloRating ?? 1000,
    isActive: api.isActive ?? true,
    tournamentCount: 0, // will be enriched by other hooks
    medalCount: 0,
    attendanceRate: 0,
    skills: MOCK_SKILLS, // skill data not yet in API
    goals: MOCK_GOALS,
    beltHistory: MOCK_BELT_HISTORY,
    email: api.email,
    phone: api.phone,
    gender: api.gender,
    dateOfBirth: api.dateOfBirth,
  }
}

export function useAthleteProfile() {
  const { token } = useAuth()
  return useAsyncData<AthleteProfileData>(
    () => withMockFallback(
      async () => mapApiProfile(await fetchMyProfile(token)),
      () => mockDelay(MOCK_PROFILE)
    ),
    [token]
  )
}

/** Convenience alias — same as useAthleteProfile (for Profile screen) */
export const useAthleteProfileMe = useAthleteProfile

// ── Tournaments ──

export function useAthleteTournaments() {
  const { token, currentUser } = useAuth()
  return useAsyncData<MockTournament[]>(
    () => withMockFallback(
      async () => {
        const entries = await fetchTournamentEntries(token, currentUser.id)
        return entries.map((e): MockTournament => ({
          id: e.id,
          name: e.tournamentName || 'Giải đấu',
          doan: '',
          date: e.registeredAt?.substring(0, 10) || '',
          categories: e.category ? [e.category] : [],
          status: (e.status === 'approved' ? 'ok' : e.status === 'rejected' ? 'rejected' : 'missing') as MockTournament['status'],
          docs: e.documents
              ? {
                  kham_sk: !!e.documents['kham_sk'],
                  bao_hiem: !!e.documents['bao_hiem'],
                  cmnd: !!e.documents['cmnd'],
                  anh: !!e.documents['anh'],
                }
              : { kham_sk: false, bao_hiem: false, cmnd: false, anh: false },
        }))
      },
      () => mockDelay(MOCK_TOURNAMENTS)
    ),
    [token, currentUser.id]
  )
}

// ── Training ──

export interface TrainingData {
  sessions: MockTraining[]
  stats: typeof MOCK_ATTENDANCE_STATS
}

export function useAthleteTraining() {
  const { token, currentUser } = useAuth()
  return useAsyncData<TrainingData>(
    () => withMockFallback(
      async () => {
        const [sessions, stats] = await Promise.all([
          fetchTrainingSessions(token, currentUser.id),
          fetchTrainingStats(token, currentUser.id),
        ])
        return {
          sessions: sessions.map((s): MockTraining => ({
            id: s.id,
            type: (s.type as MockTraining['type']) || 'regular',
            date: s.date,
            time: [s.startTime, s.endTime].filter(Boolean).join(' – ') || '',
            location: s.location || '',
            coach: s.coach || '',
            status: (s.status as MockTraining['status']) || 'scheduled',
          })),
          stats: {
            total: stats.total,
            attended: stats.attended,
            streak: stats.streak,
            absent: stats.absent,
            cancelled: stats.cancelled,
            rate: stats.rate,
          },
        }
      },
      () => mockDelay({ sessions: MOCK_TRAINING, stats: MOCK_ATTENDANCE_STATS })
    ),
    [token, currentUser.id]
  )
}

// ── Results (v3: API with mock fallback) ──

export interface ResultsData {
  results: MockResult[]
  medals: typeof MOCK_MEDALS
  eloRating: number
  totalTournaments: number
}

export function useAthleteResults() {
  const { token, currentUser } = useAuth()
  return useAsyncData<ResultsData>(
    () => withMockFallback(
      async () => {
        const summary: ResultsSummaryAPI = await fetchMatchResults(token, currentUser.id)
        return {
          results: summary.results.map((r): MockResult => ({
            id: r.id,
            name: r.tournamentName,
            medal: r.medal === 'gold' ? '🥇' : r.medal === 'silver' ? '🥈' : r.medal === 'bronze' ? '🥉' : '',
            result: r.result,
            category: r.category,
            date: r.date,
          })),
          medals: summary.medals,
          eloRating: summary.eloRating,
          totalTournaments: summary.totalTournaments,
        }
      },
      () => mockDelay({
        results: MOCK_RESULTS,
        medals: MOCK_MEDALS,
        eloRating: 1450,
        totalTournaments: 12,
      })
    ),
    [token, currentUser.id]
  )
}

// ── Rankings (v3: API with mock fallback) ──

export interface RankingsData {
  rankings: MockRanking[]
  eloHistory: number[]
}

export function useAthleteRankings() {
  const { token, currentUser } = useAuth()
  return useAsyncData<RankingsData>(
    () => withMockFallback(
      async () => {
        const data: RankingsDataAPI = await fetchAthleteRankings(token, currentUser.id)
        return {
          rankings: data.rankings.map((r): MockRanking => ({
            label: r.label,
            rank: `#${r.rank}`,
            trend: r.trend > 0 ? `↑ ${r.trend}` : r.trend < 0 ? `↓ ${Math.abs(r.trend)}` : '—',
          })),
          eloHistory: data.eloHistory,
        }
      },
      () => mockDelay({
        rankings: MOCK_RANKINGS,
        eloHistory: MOCK_ELO_HISTORY,
      })
    ),
    [token, currentUser.id]
  )
}

// ── Notifications (v3: API with mock fallback) ──

export function useNotifications() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<MockNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(() => {
    setIsLoading(true)
    withMockFallback(
      async () => {
        const items: NotificationAPI[] = await fetchNotificationsAPI(token)
        return items.map((n): MockNotification => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          time: n.time,
          read: n.read,
        }))
      },
      () => mockDelay(MOCK_NOTIFICATIONS)
    ).then(data => {
      setNotifications(data)
      setIsLoading(false)
    })
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  return { notifications, isLoading, markAsRead, markAllRead, refetch: fetchData }
}

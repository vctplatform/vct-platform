// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Route Types
// Centralized type-safe route definitions for the entire app.
// All screen names, param types, and deep link patterns in one
// place so navigation is fully type-checked at compile time.
// ═══════════════════════════════════════════════════════════════

// ── Auth Stack ───────────────────────────────────────────────

export type AuthStackParamList = {
  Onboarding: undefined
  Login: { returnTo?: string } | undefined
  Register: { inviteCode?: string } | undefined
  ForgotPassword: { email?: string } | undefined
  ResetPassword: { token: string }
  VerifyOTP: { phone: string; purpose: 'login' | 'register' }
}

// ── Main Tab Navigator ───────────────────────────────────────

export type MainTabParamList = {
  HomeTab: undefined
  TournamentsTab: undefined
  TrainingTab: undefined
  ProfileTab: undefined
}

// ── Home Stack ───────────────────────────────────────────────

export type HomeStackParamList = {
  HomeScreen: undefined
  NotificationList: undefined
  NotificationDetail: { id: string }
  AnnouncementDetail: { id: string }
}

// ── Tournament Stack ─────────────────────────────────────────

export type TournamentStackParamList = {
  TournamentList: { status?: 'upcoming' | 'ongoing' | 'completed' } | undefined
  TournamentDetail: { id: string }
  TournamentRegistration: { tournamentId: string }
  BracketView: { tournamentId: string; categoryId: string }
  MatchDetail: { matchId: string }
  LiveScoring: { matchId: string }
  AthleteProfile: { athleteId: string }
  TeamDetail: { teamId: string }
}

// ── Training Stack ───────────────────────────────────────────

export type TrainingStackParamList = {
  TrainingHome: undefined
  TrainingPlanDetail: { planId: string }
  TechniqueDetail: { techniqueId: string }
  TechniqueVideo: { techniqueId: string; videoUrl: string }
  CurriculumDetail: { curriculumId: string }
  BeltExamDetail: { examId: string }
  ElearningCourse: { courseId: string }
}

// ── Profile Stack ────────────────────────────────────────────

export type ProfileStackParamList = {
  ProfileHome: undefined
  EditProfile: undefined
  Settings: undefined
  ChangePassword: undefined
  LanguageSettings: undefined
  ThemeSettings: undefined
  PrivacyPolicy: undefined
  TermsOfService: undefined
  About: undefined
  FeedbackForm: undefined
  MyTournaments: undefined
  MyClub: { clubId: string }
  Achievement: { achievementId: string }
}

// ── Deep Link Map ────────────────────────────────────────────

export const DEEP_LINK_CONFIG = {
  prefixes: ['vctplatform://', 'https://vct-platform.vn'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ResetPassword: 'reset-password/:token',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              HomeScreen: '',
              AnnouncementDetail: 'announcements/:id',
            },
          },
          TournamentsTab: {
            screens: {
              TournamentList: 'tournaments',
              TournamentDetail: 'tournaments/:id',
              MatchDetail: 'matches/:matchId',
              AthleteProfile: 'athletes/:athleteId',
            },
          },
          TrainingTab: {
            screens: {
              TrainingHome: 'training',
              TechniqueDetail: 'techniques/:techniqueId',
            },
          },
          ProfileTab: {
            screens: {
              ProfileHome: 'profile',
              MyClub: 'clubs/:clubId',
            },
          },
        },
      },
    },
  },
} as const

// ── Screen Name Registry ─────────────────────────────────────

export const SCREEN_NAMES = {
  // Auth
  ONBOARDING: 'Onboarding' as const,
  LOGIN: 'Login' as const,
  REGISTER: 'Register' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,
  RESET_PASSWORD: 'ResetPassword' as const,
  VERIFY_OTP: 'VerifyOTP' as const,
  // Tabs
  HOME_TAB: 'HomeTab' as const,
  TOURNAMENTS_TAB: 'TournamentsTab' as const,
  TRAINING_TAB: 'TrainingTab' as const,
  PROFILE_TAB: 'ProfileTab' as const,
  // Home
  HOME_SCREEN: 'HomeScreen' as const,
  // Tournament
  TOURNAMENT_LIST: 'TournamentList' as const,
  TOURNAMENT_DETAIL: 'TournamentDetail' as const,
  BRACKET_VIEW: 'BracketView' as const,
  MATCH_DETAIL: 'MatchDetail' as const,
  LIVE_SCORING: 'LiveScoring' as const,
  // Profile
  PROFILE_HOME: 'ProfileHome' as const,
  EDIT_PROFILE: 'EditProfile' as const,
  SETTINGS: 'Settings' as const,
} as const

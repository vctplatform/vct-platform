// @ts-nocheck
import {
  isValidScreen,
  getScreenTitleEn,
  parseDeepLinkParams,
  screenGroups,
  getScreenGroup,
  isAuthScreen,
  isMainScreen
} from '../navigation-helpers'

describe('navigation-helpers', () => {
  describe('isValidScreen', () => {
    it('returns true for known screens', () => {
      expect(isValidScreen('Home')).toBe(true)
      expect(isValidScreen('Login')).toBe(true)
      expect(isValidScreen('TournamentDetail')).toBe(true)
    })

    it('returns false for unknown screens', () => {
      // @ts-expect-error Testing invalid input at runtime
      expect(isValidScreen('UnknownScreen123')).toBe(false)
      // @ts-expect-error
      expect(isValidScreen('')).toBe(false)
    })
  })

  describe('getScreenTitleEn', () => {
    it('returns correct english title for screens', () => {
      expect(getScreenTitleEn('Home')).toBe('Home')
      expect(getScreenTitleEn('TournamentDetail')).toBe('Tournament Details')
      expect(getScreenTitleEn('Login')).toBe('Login')
    })

    it('returns fallback for unknown screens', () => {
      // @ts-expect-error
      expect(getScreenTitleEn('Unknown')).toBe('VCT Platform')
    })
  })

  describe('parseDeepLinkParams', () => {
    it('parses tournament link', () => {
      const result = parseDeepLinkParams('vct://app/tournament/123')
      expect(result).toEqual({ screen: 'TournamentDetail', params: { id: '123' } })
    })

    it('parses athlete link', () => {
      const result = parseDeepLinkParams('vct://app/athlete/456')
      expect(result).toEqual({ screen: 'AthleteProfile', params: { id: '456' } })
    })

    it('parses scoring link', () => {
      const result = parseDeepLinkParams('vct://app/scoring/789')
      expect(result).toEqual({ screen: 'MatchScoring', params: { id: '789' } })
    })

    it('returns null for unknown links', () => {
      expect(parseDeepLinkParams('vct://app/unknown/route')).toBeNull()
      expect(parseDeepLinkParams('https://google.com')).toBeNull()
    })
  })

  describe('screenGroups', () => {
    it('correctly maps screen groups', () => {
      expect(getScreenGroup('Login')).toBe('auth')
      expect(getScreenGroup('Home')).toBe('main')
      expect(getScreenGroup('TournamentDetail')).toBe('tournament')
      expect(getScreenGroup('AdminPortal')).toBe('portal')
      expect(getScreenGroup('Settings')).toBe('settings')
    })

    it('identifies auth screens', () => {
      expect(isAuthScreen('Login')).toBe(true)
      expect(isAuthScreen('Register')).toBe(true)
      expect(isAuthScreen('Home')).toBe(false)
    })

    it('identifies main screens', () => {
      expect(isMainScreen('Home')).toBe(true)
      expect(isMainScreen('Tournaments')).toBe(true)
      expect(isMainScreen('Login')).toBe(false)
    })
  })
})

import * as React from 'react'
import { Ionicons } from '@expo/vector-icons'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Icon System
// Centralized icon wrapper using Ionicons (replaces all emoji icons)
// Usage: <Icon name="home" size={22} color={Colors.accent} />
// ═══════════════════════════════════════════════════════════════

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

export interface IconProps {
  name: IoniconsName
  size?: number
  color?: string
  style?: object
}

/** Core icon component — wraps Ionicons */
export function Icon({ name, size = 20, color = '#64748b', style }: IconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />
}

// ── Semantic Icon Mapping ────────────────────────────────────
// Maps VCT domain concepts to Ionicons names for consistent usage

export const VCTIcons = {
  // Navigation
  home: 'home' as IoniconsName,
  homeFilled: 'home' as IoniconsName,
  homeOutline: 'home-outline' as IoniconsName,
  trophy: 'trophy' as IoniconsName,
  trophyOutline: 'trophy-outline' as IoniconsName,
  calendar: 'calendar' as IoniconsName,
  calendarOutline: 'calendar-outline' as IoniconsName,
  person: 'person' as IoniconsName,
  personOutline: 'person-outline' as IoniconsName,
  settings: 'settings' as IoniconsName,
  settingsOutline: 'settings-outline' as IoniconsName,
  notifications: 'notifications' as IoniconsName,
  notificationsOutline: 'notifications-outline' as IoniconsName,

  // Actions
  add: 'add' as IoniconsName,
  edit: 'create-outline' as IoniconsName,
  close: 'close' as IoniconsName,
  back: 'chevron-back' as IoniconsName,
  forward: 'chevron-forward' as IoniconsName,
  search: 'search' as IoniconsName,
  filter: 'funnel-outline' as IoniconsName,
  refresh: 'refresh' as IoniconsName,
  share: 'share-outline' as IoniconsName,

  // Auth
  lock: 'lock-closed-outline' as IoniconsName,
  eye: 'eye-outline' as IoniconsName,
  eyeOff: 'eye-off-outline' as IoniconsName,
  logout: 'log-out-outline' as IoniconsName,
  key: 'key-outline' as IoniconsName,

  // Athletic / VCT domain
  fitness: 'fitness' as IoniconsName,
  medal: 'medal-outline' as IoniconsName,
  stats: 'stats-chart' as IoniconsName,
  podium: 'podium-outline' as IoniconsName,
  timer: 'timer-outline' as IoniconsName,
  flash: 'flash-outline' as IoniconsName,
  shield: 'shield-checkmark-outline' as IoniconsName,
  star: 'star' as IoniconsName,
  starOutline: 'star-outline' as IoniconsName,
  flame: 'flame' as IoniconsName,
  trending: 'trending-up' as IoniconsName,
  trendingDown: 'trending-down' as IoniconsName,

  // Info & Status
  checkmark: 'checkmark-circle' as IoniconsName,
  checkmarkOutline: 'checkmark-circle-outline' as IoniconsName,
  warning: 'warning-outline' as IoniconsName,
  alert: 'alert-circle-outline' as IoniconsName,
  info: 'information-circle-outline' as IoniconsName,
  help: 'help-circle-outline' as IoniconsName,

  // Content
  document: 'document-text-outline' as IoniconsName,
  camera: 'camera-outline' as IoniconsName,
  image: 'image-outline' as IoniconsName,
  mail: 'mail-outline' as IoniconsName,
  call: 'call-outline' as IoniconsName,
  location: 'location-outline' as IoniconsName,
  time: 'time-outline' as IoniconsName,
  globe: 'globe-outline' as IoniconsName,
  phone: 'phone-portrait-outline' as IoniconsName,
  moon: 'moon-outline' as IoniconsName,
  sunny: 'sunny-outline' as IoniconsName,
  cellular: 'cellular-outline' as IoniconsName,
  wifi: 'wifi-outline' as IoniconsName,
  cloudOffline: 'cloud-offline-outline' as IoniconsName,

  // Misc
  heart: 'heart' as IoniconsName,
  heartOutline: 'heart-outline' as IoniconsName,
  people: 'people-outline' as IoniconsName,
  ribbon: 'ribbon-outline' as IoniconsName,
  barbell: 'barbell-outline' as IoniconsName,
  body: 'body-outline' as IoniconsName,
  newspaper: 'newspaper-outline' as IoniconsName,
  clipboard: 'clipboard-outline' as IoniconsName,
  cloudUpload: 'cloud-upload-outline' as IoniconsName,
  grid: 'grid-outline' as IoniconsName,
  book: 'book-outline' as IoniconsName,
} as const

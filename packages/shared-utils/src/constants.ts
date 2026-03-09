// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — SHARED CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Default timezone for all date operations */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Default locale */
export const DEFAULT_LOCALE = 'vi-VN';

/** Phone country prefix */
export const PHONE_PREFIX = '+84';

/** API version */
export const API_VERSION = 'v1';

/** RBAC Roles */
export const ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    FEDERATION_ADMIN: 'FEDERATION_ADMIN',
    CLUB_MANAGER: 'CLUB_MANAGER',
    COACH: 'COACH',
    REFEREE: 'REFEREE',
    ATHLETE: 'ATHLETE',
    SPECTATOR: 'SPECTATOR',
} as const;

/** RBAC Scope Types */
export const SCOPE_TYPES = {
    SYSTEM: 'SYSTEM',
    FEDERATION: 'FEDERATION',
    TOURNAMENT: 'TOURNAMENT',
    CLUB: 'CLUB',
} as const;

/** Maximum file upload sizes (bytes) */
export const MAX_UPLOAD_SIZES = {
    IMAGE: 5 * 1024 * 1024,      // 5MB
    VIDEO: 500 * 1024 * 1024,     // 500MB
    DOCUMENT: 20 * 1024 * 1024,   // 20MB
} as const;

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — VIETNAMESE DATE FORMATTING
// ════════════════════════════════════════════════════════════════

const VI_MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const VI_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/**
 * Format date to Vietnamese DD/MM/YYYY format
 */
export function formatDateVI(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format date with day name in Vietnamese
 */
export function formatDateFullVI(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayName = VI_DAYS[d.getDay()];
    return `${dayName}, ${formatDateVI(d)}`;
}

/**
 * Format date with time in Vietnamese format
 */
export function formatDateTimeVI(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${formatDateVI(d)} ${hours}:${minutes}`;
}

/**
 * Get month name in Vietnamese
 */
export function getMonthNameVI(month: number): string {
    return VI_MONTHS[month] || '';
}

/**
 * Get relative time in Vietnamese
 */
export function relativeTimeVI(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 30) return `${days} ngày trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
}

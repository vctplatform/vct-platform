// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — VND CURRENCY FORMATTING
// ════════════════════════════════════════════════════════════════

/**
 * Format number to VND currency string (e.g., 1.000.000 VNĐ)
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number to VND short form (e.g., 1.5tr, 500N)
 */
export function formatVNDShort(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
    }
    if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(0)}N`;
    }
    return `${amount} đ`;
}

/**
 * Parse VND string back to number
 */
export function parseVND(value: string): number {
    return Number(value.replace(/[^\d]/g, ''));
}

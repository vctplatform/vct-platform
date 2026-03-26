'use client'

/* ────────────────────────────────────────────
 *  VCT_QRCode
 *  Pure SVG QR Code generator.
 *  Generates a QR code using a simple implementation
 *  without external dependencies.
 * ──────────────────────────────────────────── */

export interface VCT_QRCodeProps {
    /** Data string to encode */
    value: string
    /** QR code size in pixels */
    size?: number
    /** Include quiet zone margin */
    includeMargin?: boolean
    /** Module color */
    fgColor?: string
    /** Background color */
    bgColor?: string
}

/**
 * Simplified QR code matrix generator.
 * Uses a deterministic hashing approach to generate a visually consistent
 * QR-like pattern. For production-grade QR codes that can be scanned by
 * readers, integrate a full QR encoder like 'qrcode' library.
 *
 * This implementation generates a scannable-looking SVG pattern based on
 * the input data. For actual scannable QR codes, the app can swap in
 * a real encoder later.
 */
function generateQRMatrix(data: string, moduleCount: number = 25): boolean[][] {
    const matrix: boolean[][] = Array.from({ length: moduleCount }, () =>
        Array(moduleCount).fill(false),
    )

    // Add finder patterns (3 corners)
    const addFinderPattern = (row: number, col: number) => {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const mr = row + r
                const mc = col + c
                if (mr < 0 || mr >= moduleCount || mc < 0 || mc >= moduleCount) continue
                if (r === -1 || r === 7 || c === -1 || c === 7) {
                    matrix[mr]![mc] = false // separator
                } else if (r === 0 || r === 6 || c === 0 || c === 6) {
                    matrix[mr]![mc] = true
                } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                    matrix[mr]![mc] = true
                } else {
                    matrix[mr]![mc] = false
                }
            }
        }
    }

    addFinderPattern(0, 0) // Top-left
    addFinderPattern(0, moduleCount - 7) // Top-right
    addFinderPattern(moduleCount - 7, 0) // Bottom-left

    // Timing patterns
    for (let i = 8; i < moduleCount - 8; i++) {
        matrix[6]![i] = i % 2 === 0
        matrix[i]![6] = i % 2 === 0
    }

    // Data area - seed from input string hash
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
    }

    // Fill data modules with a pattern derived from the input
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            // Skip finder and timing regions
            if (r < 9 && c < 9) continue
            if (r < 9 && c >= moduleCount - 8) continue
            if (r >= moduleCount - 8 && c < 9) continue
            if (r === 6 || c === 6) continue

            // Generate pseudo-random fill from hash and position
            const seed = (hash * (r * moduleCount + c + 1) * 31) & 0xFFFFFF
            matrix[r]![c] = (seed % 3) !== 0
        }
    }

    return matrix
}

export function VCT_QRCode({
    value,
    size = 160,
    includeMargin = true,
    fgColor,
    bgColor,
}: VCT_QRCodeProps) {
    const moduleCount = 25
    const margin = includeMargin ? 2 : 0
    const totalModules = moduleCount + margin * 2
    const cellSize = size / totalModules
    const matrix = generateQRMatrix(value, moduleCount)

    const fg = fgColor ?? 'var(--vct-text-primary)'
    const bg = bgColor ?? 'var(--vct-bg-elevated)'

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`QR Code: ${value}`}
            style={{ borderRadius: 'var(--vct-radius-sm)' }}
        >
            {/* Background */}
            <rect width={size} height={size} fill={bg} />
            {/* Modules */}
            {matrix.map((row, r) =>
                row.map((cell, c) =>
                    cell ? (
                        <rect
                            key={`${r}-${c}`}
                            x={(c + margin) * cellSize}
                            y={(r + margin) * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={fg}
                        />
                    ) : null,
                ),
            )}
        </svg>
    )
}

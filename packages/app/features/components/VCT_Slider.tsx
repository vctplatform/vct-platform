'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTSliderProps {
    /** Current value */
    value?: number
    /** Change handler */
    onChange?: (value: number) => void
    /** Minimum value */
    min?: number
    /** Maximum value */
    max?: number
    /** Step increment */
    step?: number
    /** Label above the slider */
    label?: ReactNode
    /** Show the current numeric value next to the slider */
    showValue?: boolean
    /** Disable the slider */
    disabled?: boolean
    /** Color for the filled track */
    color?: string
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Slider = ({
    value = 0,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    disabled = false,
    color = 'var(--vct-accent)',
    className,
    style,
}: VCTSliderProps) => {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

    return (
        <div className={cn('grid gap-2', className ?? '')} style={style}>
            {/* Header row */}
            {(label || showValue) ? (
                <div className="flex items-center justify-between">
                    {label ? (
                        <span className="text-xs font-bold text-vct-text-secondary">
                            {label}
                        </span>
                    ) : <span />}
                    {showValue ? (
                        <span
                            className="text-sm font-extrabold tabular-nums"
                            style={{ color }}
                        >
                            {value}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {/* Slider track */}
            <div className="relative flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange?.(Number(e.target.value))}
                    className={cn(
                        'vct-slider-input w-full cursor-pointer appearance-none bg-transparent',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                    style={
                        {
                            '--slider-pct': `${pct}%`,
                            '--slider-color': color,
                        } as CSSProperties
                    }
                />
            </div>

            {/* Min/Max labels */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-vct-text-muted tabular-nums">
                <span>{min}</span>
                <span>{max}</span>
            </div>

            {/* Inline styles for the range input (cross-browser) */}
            <style>{`
        .vct-slider-input {
          height: 6px;
        }
        .vct-slider-input::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--slider-color) 0%,
            var(--slider-color) var(--slider-pct),
            var(--vct-border, #333) var(--slider-pct),
            var(--vct-border, #333) 100%
          );
        }
        .vct-slider-input::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: var(--vct-border, #333);
        }
        .vct-slider-input::-moz-range-progress {
          border-radius: 999px;
          background: var(--slider-color);
          height: 6px;
        }
        .vct-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--slider-color);
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          margin-top: -6px;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .vct-slider-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--slider-color);
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .vct-slider-input:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
        .vct-slider-input:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--slider-color) 30%, transparent);
        }
      `}</style>
        </div>
    )
}

export const VCTSlider = VCT_Slider as FC<VCTSliderProps>

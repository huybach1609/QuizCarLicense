"use client";

import React, { useId, useMemo } from "react";

/**
 * 1. BarcodeStrip: Renders a precise SVG barcode accent
 * Directly inspired by Lattice Observatory's header and button motifs.
 */
export function BarcodeStrip({
  height = 14,
  className = "",
  bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2],
}: {
  height?: number;
  className?: string;
  bars?: number[];
}) {
  const totalWidth = bars.reduce((acc, b) => acc + b + 1.5, 0);

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      fill="currentColor"
      className={`shrink-0 opacity-80 ${className}`}
      aria-hidden="true"
    >
      {bars.map((w, idx) => {
        const x = bars.slice(0, idx).reduce((acc, b) => acc + b + 1.5, 0);
        return <rect key={idx} x={x} y={0} width={w} height={height} rx={0.5} />;
      })}
    </svg>
  );
}

/**
 * 2. FrequencyRuler: Horizontal precision tick ruler
 */
export function FrequencyRuler({
  count = 24,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-end gap-1 h-3 overflow-hidden opacity-40 select-none ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, idx) => {
        const isMajor = idx % 5 === 0;
        return (
          <span
            key={idx}
            className={`w-[1px] bg-foreground shrink-0 ${
              isMajor ? "h-3 opacity-90" : "h-1.5 opacity-50"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * 3. ScoreDistributionWaveform: Minimalist Historical Score Distribution Curve
 * Distilled: Pure graphic clarity without distracting text annotations,
 * displaying only the smooth distribution curve, pass threshold, and scale endpoints.
 */
export function ScoreDistributionWaveform({
  licenseCode = "B",
  questionCount = 30,
  passScore = 27,
  className = "",
}: {
  licenseCode?: string;
  questionCount?: number;
  passScore?: number;
  className?: string;
}) {
  const gradientId = useId();

  // Dimensions of SVG canvas
  const width = 360;
  const height = 80;
  const baseY = 66;
  const peakY = 14;

  // Pass threshold X coordinate
  const passRatio = questionCount > 0 ? passScore / questionCount : 0.8;
  const passX = Math.round(passRatio * width);

  // Peak X coordinate (typically around passScore)
  const peakScore = Math.min(questionCount - 1, passScore + 1);
  const peakX = Math.round((peakScore / questionCount) * width);

  // Smooth distribution curve
  const p0 = { x: 0, y: baseY };
  const p1 = { x: Math.round(width * 0.35), y: baseY - 3 };
  const p2 = { x: Math.round(width * 0.55), y: baseY - 14 };
  const p3 = { x: Math.round(passX - 25), y: baseY - 32 };
  const pPeak = { x: peakX, y: peakY };
  const pEnd = { x: width, y: baseY - 10 };

  const curvePath = `M ${p0.x} ${p0.y} 
    C ${p1.x} ${p1.y}, ${p2.x - 20} ${p2.y}, ${p3.x} ${p3.y} 
    S ${pPeak.x - 20} ${pPeak.y}, ${pPeak.x} ${pPeak.y} 
    S ${width - 25} ${pPeak.y + 10}, ${pEnd.x} ${pEnd.y}`;

  const areaPath = `${curvePath} L ${width} ${baseY} L 0 ${baseY} Z`;

  return (
    <div
      className={`relative w-full h-[88px] border border-border bg-card/60 overflow-hidden flex flex-col justify-center p-2 font-mono select-none ${className}`}
    >
      {/* Background Vertical Scanlines / Barcode Raster */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor, currentColor 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden="true"
      />

      {/* Pure SVG Waveform (No Text Clutter) */}
      <div className="relative z-10 w-full h-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill under curve */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Main distribution stroke */}
          <path
            d={curvePath}
            stroke="var(--primary)"
            strokeWidth="1.75"
            fill="none"
            strokeLinecap="round"
          />

          {/* Baseline */}
          <line
            x1="0"
            y1={baseY}
            x2={width}
            y2={baseY}
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1"
          />

          {/* Vertical Pass Threshold Line */}
          <line
            x1={passX}
            y1="6"
            x2={passX}
            y2={baseY}
            stroke="var(--primary)"
            strokeWidth="1.25"
            strokeDasharray="3 3"
          />

          {/* Peak Dot indicator */}
          <circle cx={pPeak.x} cy={pPeak.y} r="2.5" fill="var(--primary)" />

          {/* Minimalist Axis Scale Numbers */}
          <text
            x="2"
            y={height - 2}
            fill="currentColor"
            opacity="0.5"
            fontSize="9"
            fontFamily="monospace"
          >
            0
          </text>

          <text
            x={passX}
            y={height - 2}
            fill="var(--primary)"
            fontWeight="bold"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {passScore}
          </text>

          <text
            x={width - 2}
            y={height - 2}
            fill="currentColor"
            opacity="0.5"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {questionCount}
          </text>
        </svg>
      </div>
    </div>
  );
}

/**
 * 3. SignalWaveform: Legacy alias / backwards compatibility
 */
export const SignalWaveform = ScoreDistributionWaveform;

/**
 * 4. DensityBar: Segmented ASCII-like visual telemetry progress bar
 */
export function DensityBar({
  value,
  max,
  segments = 12,
  className = "",
}: {
  value: number;
  max: number;
  segments?: number;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const activeCount = value > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;
  const percentage = Math.round(ratio * 100);

  return (
    <div className={`flex items-center gap-2 font-mono text-[11px] ${className}`}>
      <span className="tabular-nums font-bold text-foreground min-w-[36px] text-right">
        {percentage}%
      </span>
      <div className="flex items-center gap-[2px]" aria-hidden="true">
        {Array.from({ length: segments }).map((_, idx) => (
          <span
            key={idx}
            className={`w-[3px] h-3 rounded-[0.5px] transition-colors ${
              idx < activeCount
                ? "bg-primary"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

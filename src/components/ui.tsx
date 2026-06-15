import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Shared layout primitives                                           */
/* ------------------------------------------------------------------ */

export function Panel({
  children,
  className = "",
  accent,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** CSS color for a left accent bar */
  accent?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`cc-panel ${className}`}
      style={accent ? { borderLeft: `3px solid ${accent}`, ...style } : style}
    >
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`cc-label ${className}`} style={color ? { color } : undefined}>
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "open",
}: {
  children: ReactNode;
  tone?: "high" | "medium" | "low" | "ok" | "open";
}) {
  return <span className={`cc-pill cc-pill--${tone}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/*  Icons — Lucide-style, recolour via currentColor                    */
/* ------------------------------------------------------------------ */

type IconProps = { size?: number };

function Svg({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function HeadsetIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 12a9 9 0 0 1 18 0" />
      <path d="M21 15v2a4 4 0 0 1-4 4h-4" />
      <rect x="2" y="12" width="4" height="7" rx="1.2" />
      <rect x="18" y="12" width="4" height="7" rx="1.2" />
    </Svg>
  );
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

export function TargetIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ScriptIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M5 3h11l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v5h5M8 12h8M8 16h6" />
    </Svg>
  );
}

export function ChatIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M14 9a3 3 0 0 1-3 3H7l-3 3V5a2 2 0 0 1 2-2h6a3 3 0 0 1 3 3z" />
      <path d="M14 8h3a3 3 0 0 1 3 3v9l-3-3h-4a3 3 0 0 1-3-3" />
    </Svg>
  );
}

export function AlertIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Svg>
  );
}

export function ResetIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Svg>
  );
}

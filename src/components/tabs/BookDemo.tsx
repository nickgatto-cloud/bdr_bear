import type { ReactNode } from "react";
import { BDRS, type Segment } from "@/lib/reps";

type Accent = "denim" | "orange" | "green";

const SEGMENTS: { key: Segment; label: string; accent: Accent; icon: ReactNode }[] = [
  { key: "Mid Market", label: "MID MARKET", accent: "denim", icon: <BuildingIcon /> },
  { key: "Strategic", label: "STRATEGIC", accent: "orange", icon: <StarIcon /> },
  { key: "SMB", label: "SMB", accent: "green", icon: <UsersIcon /> },
];

export default function BookDemo() {
  return (
    <div className="px-7 py-6 space-y-7">
      {SEGMENTS.map((seg) => {
        const reps = BDRS.filter((b) => b.segment === seg.key);
        if (!reps.length) return null;
        return (
          <section key={seg.key}>
            {/* section header with hairline */}
            <div className="flex items-center gap-2 mb-4 text-[var(--fg-muted)]">
              {seg.icon}
              <span className="text-xs font-semibold tracking-[0.12em]">
                {seg.label}
              </span>
              <div className="flex-1 h-px bg-[var(--border)] ml-2" />
            </div>

            {/* rep cards — flex so each segment's cards fill the row */}
            <div className="flex flex-wrap gap-4">
              {reps.map((rep) => (
                <div
                  key={rep.name}
                  className="book-card flex-1 min-w-[240px] flex flex-col"
                >
                  <div className="text-lg font-semibold text-[var(--fg)]">
                    {rep.name}
                  </div>
                  <div className="text-[13px] text-[var(--fg-muted)] mb-4">
                    {rep.segment}
                  </div>
                  <a
                    href={rep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="book-btn mt-auto"
                    data-accent={seg.accent}
                  >
                    <CalendarIcon />
                    Book with {rep.name}
                  </a>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---- inline icons (Lucide-style, recolour via currentColor) ---- */

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21h18" />
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

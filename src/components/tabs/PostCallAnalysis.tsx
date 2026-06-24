import { useState } from "react";
import {
  analyzeTranscript,
  SAMPLE_TRANSCRIPT,
  FANT,
  VESTT,
  type TranscriptAnalysis,
} from "@/lib/coaching";
import HubSpotCalls from "@/components/tabs/HubSpotCalls";

const ACCENT_BY_CATEGORY: Record<string, string> = {
  competitor: "var(--orange)",
  trade: "var(--green)",
  role: "var(--denim)",
  tech: "var(--purple)",
  security: "var(--denim)",
  sector: "var(--purple)",
  objection: "var(--border-strong)",
};

function overallColor(n: number): string {
  if (n >= 80) return "var(--green)";
  if (n >= 60) return "var(--orange)";
  return "var(--danger)";
}

export default function PostCallAnalysis({
  liveTranscript = "",
}: {
  liveTranscript?: string;
}) {
  // seed from the live call (re-seeds each time this view is opened)
  const [text, setText] = useState(liveTranscript);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);

  const analyze = () => {
    if (!text.trim()) return;
    setAnalysis(analyzeTranscript(text));
  };
  const reset = () => {
    setText("");
    setAnalysis(null);
  };

  return (
    <div>
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-start gap-3">
          <TargetIcon />
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              Post-call analysis
            </h3>
            <p className="text-[13px] text-[var(--fg-muted)]">
              Paste transcript → scored replay + coaching
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="score-pill">
            FANT{" "}
            <strong style={{ color: analysis ? "var(--orange)" : "var(--fg-dim)" }}>
              {analysis ? `${analysis.fantScore}/4` : "—"}
            </strong>
          </span>
          <span className="score-pill">
            VESTT{" "}
            <strong style={{ color: analysis ? "var(--denim)" : "var(--fg-dim)" }}>
              {analysis ? `${analysis.vesttScore}/5` : "—"}
            </strong>
          </span>
          <span className="score-pill">
            Overall{" "}
            <strong
              style={{
                color: analysis ? overallColor(analysis.overall) : "var(--fg-dim)",
              }}
            >
              {analysis ? `${analysis.overall}%` : "—"}
            </strong>
          </span>
        </div>
      </div>

      {/* recent calls from HubSpot → transcript pulled from Quo / Aircall */}
      <HubSpotCalls onLoad={setText} />

      <div className="cc-label flex items-center gap-2">
        <ClipboardIcon size={13} /> PASTE CALL TRANSCRIPT
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          "Paste your call transcript here…\nRep: Good morning…\nProspect: Yeah we use PlanSwift…"
        }
        className="cc-scroll w-full h-[150px] resize-y rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-4 py-3 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-dim)] outline-none focus:border-[var(--green)] transition-colors leading-relaxed"
      />

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <button className="btn-primary" onClick={analyze} disabled={!text.trim()}>
          <LinkIcon /> Analyze call ↗
        </button>
        {liveTranscript && (
          <button
            className="cc-btn"
            onClick={() => setText(liveTranscript)}
            title="Pull the transcript captured during the live call"
          >
            Pull from live call
          </button>
        )}
        <button className="cc-btn" onClick={() => setText(SAMPLE_TRANSCRIPT)}>
          Load sample
        </button>
        <button className="cc-btn" onClick={reset} title="Clear" aria-label="Clear">
          <RefreshIcon />
        </button>
        <span className="text-[13px] text-[var(--fg-dim)]">
          {liveTranscript
            ? "Pre-filled from the live call — edit, then Analyze"
            : "Supports raw notes, call logs, or Gong/Chorus exports"}
        </span>
      </div>

      {/* result / empty state */}
      <div className="mt-5">
        {!analysis ? (
          <div className="flex flex-col items-center justify-center text-center py-10 text-[var(--fg-dim)]">
            <ClipboardIcon size={26} />
            <p className="mt-3 text-[15px]">Paste a transcript and hit Analyze</p>
          </div>
        ) : (
          <div className="cc-enter space-y-5">
            {/* coverage summary */}
            <div className="cc-panel p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="font-semibold">Replay summary</h4>
                <span
                  className="cc-pill"
                  style={{
                    color: overallColor(analysis.overall),
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${overallColor(analysis.overall)}`,
                  }}
                >
                  {analysis.overall >= 80
                    ? "Strong call"
                    : analysis.overall >= 60
                    ? "Solid — close the gaps"
                    : "Needs work"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Coverage
                  label="FANT covered"
                  items={FANT.map((f) => ({
                    key: f.key,
                    label: f.label,
                    on: analysis.fantCovered.includes(f.key),
                  }))}
                  accent="var(--orange)"
                />
                <Coverage
                  label="VESTT covered"
                  items={VESTT.map((v) => ({
                    key: v.key,
                    label: v.label,
                    on: analysis.vesttCovered.includes(v.key),
                  }))}
                  accent="var(--denim)"
                />
              </div>
            </div>

            {/* moments */}
            {analysis.moments.length > 0 && (
              <div>
                <div className="cc-label">
                  Key moments ({analysis.moments.length})
                </div>
                <div className="space-y-3">
                  {analysis.moments.map((m) => (
                    <div
                      key={m.card.id}
                      className="cc-panel p-4"
                      style={{
                        borderLeft: `3px solid ${
                          ACCENT_BY_CATEGORY[m.card.category] ?? "var(--border-strong)"
                        }`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[11px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                          style={{
                            color:
                              ACCENT_BY_CATEGORY[m.card.category] ??
                              "var(--fg-muted)",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          {m.card.tag}
                        </span>
                        <span className="text-[var(--fg)] font-semibold text-[15px]">
                          {m.card.heading}
                        </span>
                      </div>
                      {m.line && (
                        <p className="text-[var(--fg-dim)] text-[14px] italic mb-2">
                          “{m.line}”
                        </p>
                      )}
                      <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
                        <span className="text-[var(--fg)] font-medium">
                          Ideal play:{" "}
                        </span>
                        {m.card.talkTrack}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* gaps */}
            {analysis.gaps.length > 0 && (
              <div>
                <div className="cc-label" style={{ color: "var(--danger)" }}>
                  Coach — work on this
                </div>
                <div className="cc-panel p-4 space-y-2">
                  {analysis.gaps.map((g, i) => (
                    <p
                      key={i}
                      className="text-[var(--fg-muted)] text-[14px] leading-relaxed pl-4 relative"
                    >
                      <span
                        className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--danger)" }}
                      />
                      {g}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Coverage({
  label,
  items,
  accent,
}: {
  label: string;
  items: { key: string; label: string; on: boolean }[];
  accent: string;
}) {
  return (
    <div>
      <div className="cc-label mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it.key}
            className="px-2.5 py-1 rounded-full text-[12px] font-semibold border"
            style={
              it.on
                ? {
                    color: accent,
                    borderColor: accent,
                    background: "rgba(255,255,255,0.04)",
                  }
                : {
                    color: "var(--fg-dim)",
                    borderColor: "var(--border)",
                    textDecoration: "line-through",
                  }
            }
          >
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- icons ---- */
function TargetIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="text-[var(--fg-muted)] mt-0.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
function ClipboardIcon({ size = 16 }: { size?: number }) {
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
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function RefreshIcon() {
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
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

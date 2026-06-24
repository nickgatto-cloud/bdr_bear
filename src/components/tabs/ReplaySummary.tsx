import { FANT, VESTT, type TranscriptAnalysis } from "@/lib/coaching";

const ACCENT_BY_CATEGORY: Record<string, string> = {
  competitor: "var(--orange)",
  trade: "var(--green)",
  role: "var(--denim)",
  tech: "var(--purple)",
  security: "var(--denim)",
  sector: "var(--purple)",
  objection: "var(--border-strong)",
};

export function overallColor(n: number): string {
  if (n >= 80) return "var(--green)";
  if (n >= 60) return "var(--orange)";
  return "var(--danger)";
}

/**
 * The FANT/VESTT coverage card — shared by Post-call analysis and the live
 * Practice scenario so both score in the same "Replay summary" format.
 */
export default function ReplaySummary({ analysis }: { analysis: TranscriptAnalysis }) {
  const color = overallColor(analysis.overall);
  return (
    <div className="cc-panel p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="font-semibold">Replay summary</h4>
        <span
          className="cc-pill"
          style={{
            color,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${color}`,
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

/** Matched battlecard moments from the transcript — shared by both views. */
export function KeyMoments({ analysis }: { analysis: TranscriptAnalysis }) {
  if (!analysis.moments.length) return null;
  return (
    <div>
      <div className="cc-label">Key moments ({analysis.moments.length})</div>
      <div className="space-y-3">
        {analysis.moments.map((m) => {
          const accent = ACCENT_BY_CATEGORY[m.card.category] ?? "var(--border-strong)";
          return (
            <div
              key={m.card.id}
              className="cc-panel p-4"
              style={{ borderLeft: `3px solid ${accent}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[11px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                  style={{ color: accent, background: "rgba(255,255,255,0.04)" }}
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
                <span className="text-[var(--fg)] font-medium">Ideal play: </span>
                {m.card.talkTrack}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Uncovered FANT/VESTT dimensions → what to work on. Shared by both views. */
export function CoachGaps({ analysis }: { analysis: TranscriptAnalysis }) {
  if (!analysis.gaps.length) return null;
  return (
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
  );
}

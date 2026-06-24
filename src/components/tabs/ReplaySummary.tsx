import { FANT, VESTT, type TranscriptAnalysis } from "@/lib/coaching";

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

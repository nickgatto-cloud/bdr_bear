import { OPENER, VESTT, VESTT_SCRIPT, type VesttKey } from "@/lib/coaching";

export default function CallScript({
  vestt,
  setVesttValue,
}: {
  vestt: Record<VesttKey, boolean>;
  setVesttValue: (k: VesttKey, v: boolean) => void;
}) {
  const done = (Object.keys(vestt) as VesttKey[]).filter((k) => vestt[k]).length;

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Guided call script</h2>
          <p className="text-[var(--fg-muted)] text-[15px] mt-1">
            Open, then work the VESTT motion. Mark each stage as you complete it —
            it syncs with the live tracker.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[var(--denim)] tabular-nums">
            {done}
            <span className="text-[var(--fg-dim)] text-xl">/5</span>
          </div>
          <div className="cc-label mb-0 mt-1">stages done</div>
        </div>
      </div>

      <div className="cc-scroll max-h-[520px] overflow-y-auto pr-2 space-y-4">
        {/* opener */}
        <ScriptCard
          badge="0"
          accent="var(--green)"
          title={OPENER.title}
          goal={OPENER.goal}
          lines={OPENER.lines}
        />

        {/* VESTT stages */}
        {VESTT.map((stage, idx) => {
          const script = VESTT_SCRIPT[stage.key];
          const isDone = vestt[stage.key];
          return (
            <ScriptCard
              key={stage.key}
              badge={stage.label}
              accent="var(--denim)"
              title={`${idx + 1}. ${script.title}`}
              goal={script.goal}
              lines={script.lines}
              done={isDone}
              onToggle={() => setVesttValue(stage.key, !isDone)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScriptCard({
  badge,
  accent,
  title,
  goal,
  lines,
  done,
  onToggle,
}: {
  badge: string;
  accent: string;
  title: string;
  goal: string;
  lines: string[];
  done?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className="cc-panel p-5"
      style={{ borderLeft: `3px solid ${done ? "var(--green)" : accent}` }}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex-none w-9 h-9 rounded-full grid place-items-center font-bold text-sm"
          style={{
            background: done ? "var(--green-soft)" : "var(--surface)",
            color: done ? "var(--green)" : accent,
            border: `1px solid ${done ? "var(--green)" : "var(--border-strong)"}`,
          }}
        >
          {done ? "✓" : badge}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">{title}</h3>
            {onToggle && (
              <button
                className={`cc-btn ${done ? "" : "cc-btn--accent"}`}
                onClick={onToggle}
                style={
                  done
                    ? {
                        borderColor: "var(--green)",
                        color: "#b9ecc7",
                        background: "var(--green-soft)",
                      }
                    : undefined
                }
              >
                {done ? "Done ✓" : "Mark done"}
              </button>
            )}
          </div>
          <p className="text-[var(--fg-dim)] text-[13px] mt-0.5 mb-3">{goal}</p>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li
                key={i}
                className="text-[var(--fg-muted)] text-[15px] leading-relaxed pl-4 relative"
              >
                <span
                  className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                  style={{ background: accent }}
                />
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

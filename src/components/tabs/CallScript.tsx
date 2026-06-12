import { useState } from "react";
import {
  OPENER,
  VESTT,
  VESTT_SCRIPT,
  VESTT_INTRO,
  POST_CALL_REVIEW,
  type VesttKey,
} from "@/lib/coaching";

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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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

      {/* VESTT mindset */}
      <div
        className="cc-panel p-4 mb-5"
        style={{ borderLeft: "3px solid var(--denim)" }}
      >
        <div className="cc-label" style={{ color: "var(--denim)" }}>
          The VESTT mindset
        </div>
        <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
          {VESTT_INTRO}
        </p>
      </div>

      <div className="cc-scroll max-h-[520px] overflow-y-auto pr-2 space-y-4">
        {/* opener — unchanged */}
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
              tagline={script.tagline}
              goal={script.goal}
              mindset={script.mindset}
              principles={script.principles}
              lines={script.lines}
              done={isDone}
              onToggle={() => setVesttValue(stage.key, !isDone)}
            />
          );
        })}

        <PostCallReview />
      </div>
    </div>
  );
}

function ScriptCard({
  badge,
  accent,
  title,
  tagline,
  goal,
  mindset,
  principles,
  lines,
  done,
  onToggle,
}: {
  badge: string;
  accent: string;
  title: string;
  tagline?: string;
  goal: string;
  mindset?: string;
  principles?: string[];
  lines: string[];
  done?: boolean;
  onToggle?: () => void;
}) {
  const hasPrinciples = !!principles && principles.length > 0;
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
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{title}</h3>
              {tagline && (
                <span
                  className="text-[11px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full"
                  style={{ color: accent, background: "rgba(255,255,255,0.04)" }}
                >
                  {tagline}
                </span>
              )}
            </div>
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

          {mindset && (
            <p
              className="text-[var(--fg)] text-[14px] italic mb-3 pl-3"
              style={{ borderLeft: `2px solid ${accent}` }}
            >
              “{mindset}”
            </p>
          )}

          {hasPrinciples && (
            <div className="mb-3">
              <div className="cc-label">Principles</div>
              <ul className="space-y-1.5">
                {principles!.map((p, i) => (
                  <li
                    key={i}
                    className="text-[var(--fg-muted)] text-[14px] leading-relaxed pl-4 relative"
                  >
                    <span
                      className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                      style={{ background: accent }}
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasPrinciples && <div className="cc-label">Say it like this</div>}
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

function PostCallReview() {
  const [checked, setChecked] = useState<boolean[]>(
    POST_CALL_REVIEW.map(() => false)
  );
  const toggle = (i: number) =>
    setChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  const doneCount = checked.filter(Boolean).length;

  return (
    <div
      className="cc-panel p-5"
      style={{ borderLeft: "3px solid var(--orange)" }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Post-call review</h3>
        <span className="cc-pill cc-pill--open">
          {doneCount}/{POST_CALL_REVIEW.length}
        </span>
      </div>
      <div className="space-y-2">
        {POST_CALL_REVIEW.map((prompt, i) => (
          <button
            key={i}
            className={`cc-check ${checked[i] ? "is-on" : ""}`}
            onClick={() => toggle(i)}
          >
            <span className="box">✓</span>
            <span className="text-[14px] text-[var(--fg-muted)] leading-snug">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

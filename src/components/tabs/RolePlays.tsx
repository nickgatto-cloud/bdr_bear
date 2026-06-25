import { useMemo, useState, type ReactNode } from "react";
import { rolePlaysByCategory, type RolePlay, type ChipCategory } from "@/lib/coaching";
import PostCallAnalysis from "@/components/tabs/PostCallAnalysis";
import PracticeScenario from "@/components/tabs/PracticeScenario";

type SubTab = "angles" | "post-call" | "scenario";

const SUBTABS: { id: SubTab; label: string; icon: ReactNode }[] = [
  { id: "post-call", label: "Post-call analysis", icon: <TargetIcon /> },
  { id: "scenario", label: "Practice scenario", icon: <RepeatIcon /> },
  { id: "angles", label: "Role angles", icon: <UsersIcon /> },
];

export default function RolePlays({
  liveTranscript = "",
}: {
  liveTranscript?: string;
}) {
  const [sub, setSub] = useState<SubTab>("post-call");

  return (
    <div className="px-4 py-5 lg:px-7 lg:py-6">
      {/* secondary sub-tab nav */}
      <div className="flex justify-around items-center border-b border-[var(--border)] mb-6">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            className={`subtab ${sub === t.id ? "is-active" : ""}`}
            onClick={() => setSub(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {sub === "angles" && <RoleAngles />}
      {sub === "post-call" && <PostCallAnalysis liveTranscript={liveTranscript} />}
      {sub === "scenario" && <PracticeScenario />}
    </div>
  );
}

/* ================================================================== */
/*  Role angles — objection / competitor drills                        */
/* ================================================================== */

const GROUPS: { cat: ChipCategory; label: string }[] = [
  { cat: "objection", label: "Objections" },
  { cat: "competitor", label: "Competitors" },
  { cat: "security", label: "Security" },
];

function RoleAngles() {
  const allPlays = useMemo<RolePlay[]>(
    () => GROUPS.flatMap((g) => rolePlaysByCategory(g.cat)),
    []
  );

  const [activeId, setActiveId] = useState<string>(allPlays[0]?.id ?? "");
  const [revealed, setRevealed] = useState(false);
  const [practiced, setPracticed] = useState<Set<string>>(new Set());

  const active = allPlays.find((p) => p.id === activeId) ?? allPlays[0];

  const select = (id: string) => {
    setActiveId(id);
    setRevealed(false);
  };
  const reveal = () => {
    setRevealed(true);
    setPracticed((p) => new Set(p).add(activeId));
  };
  const shuffle = () => {
    const pool = allPlays.filter((p) => p.id !== activeId);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? active;
    select(pick.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-[var(--fg-muted)] text-[15px]">
          Pick a scenario, say your response out loud, then reveal the coaching.
        </p>
        <div className="flex items-center gap-3">
          <span className="cc-pill cc-pill--ok">
            {practiced.size}/{allPlays.length} practiced
          </span>
          <button className="cc-btn cc-btn--accent" onClick={shuffle}>
            Shuffle ⟳
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* scenario list */}
        <div className="cc-scroll max-h-[440px] overflow-y-auto pr-2 space-y-4">
          {GROUPS.map((g) => {
            const plays = rolePlaysByCategory(g.cat);
            if (!plays.length) return null;
            return (
              <div key={g.cat}>
                <div className="cc-label">{g.label}</div>
                <div className="space-y-2">
                  {plays.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => select(p.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-[14px] transition-colors flex items-center justify-between gap-2 ${
                        p.id === activeId
                          ? "border-[var(--denim)] bg-[var(--denim-soft)] text-[var(--fg)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <span className="truncate">{p.card.heading}</span>
                      {practiced.has(p.id) && (
                        <span className="text-[var(--green)] flex-none">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* drill card */}
        <div className="cc-panel p-5 lg:p-7 flex flex-col">
          <div className="cc-label" style={{ color: "var(--denim)" }}>
            Prospect says
          </div>
          <p className="text-2xl font-semibold leading-snug text-[var(--fg)] mb-6">
            “{active?.prompt}”
          </p>

          {!revealed ? (
            <div className="mt-auto">
              <p className="text-[var(--fg-dim)] text-[15px] mb-4">
                Say your response out loud first — then check it against the coach.
              </p>
              <button className="action-btn" style={{ maxWidth: 260 }} onClick={reveal}>
                Reveal coaching ↗
              </button>
            </div>
          ) : (
            <div className="cc-enter space-y-4 mt-auto">
              <div>
                <div className="cc-label">Signal</div>
                <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
                  {active?.card.signal}
                </p>
              </div>
              <div
                className="rounded-lg p-4 bg-[var(--surface)]"
                style={{ borderLeft: "3px solid var(--green)" }}
              >
                <div className="cc-label" style={{ color: "var(--green)" }}>
                  Recommended response
                </div>
                <p className="text-[var(--fg)] text-[15px] leading-relaxed">
                  {active?.card.talkTrack}
                </p>
              </div>
              {active?.card.tip && (
                <p className="text-[var(--fg-dim)] text-[14px]">
                  <span className="font-semibold text-[var(--fg-muted)]">Tip:</span>{" "}
                  {active.card.tip}
                </p>
              )}
              <button className="cc-btn cc-btn--accent" onClick={shuffle}>
                Next drill →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- sub-tab icons ---- */
function UsersIcon() {
  return (
    <svg
      width="15"
      height="15"
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
function TargetIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

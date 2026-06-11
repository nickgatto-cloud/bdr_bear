import { useMemo, useState } from "react";
import { rolePlaysByCategory, type RolePlay, type ChipCategory } from "@/lib/coaching";

const GROUPS: { cat: ChipCategory; label: string }[] = [
  { cat: "objection", label: "Objections" },
  { cat: "competitor", label: "Competitors" },
  { cat: "tech", label: "Tech" },
  { cat: "security", label: "Security" },
];

export default function RolePlays() {
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
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Role plays</h2>
          <p className="text-[var(--fg-muted)] text-[15px] mt-1">
            Pick a scenario, say your response out loud, then reveal the coaching.
          </p>
        </div>
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
        <div className="cc-scroll max-h-[480px] overflow-y-auto pr-2 space-y-4">
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
        <div className="cc-panel p-7 flex flex-col">
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

import { useState } from "react";
import { COACHING, COMPETITOR_INTEL, type ThreatLevel } from "@/lib/coaching";

const ORDER: Record<ThreatLevel, number> = { high: 0, medium: 1, low: 2 };

export default function DangerousSoftware() {
  const cards = Object.keys(COMPETITOR_INTEL)
    .map((id) => ({ id, intel: COMPETITOR_INTEL[id], card: COACHING[id] }))
    .filter((c) => c.card)
    .sort((a, b) => ORDER[a.intel.level] - ORDER[b.intel.level]);

  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="px-7 py-6">
      <div
        className="rounded-lg p-4 mb-6 flex items-start gap-3"
        style={{
          background: "var(--danger-soft)",
          border: "1px solid rgba(255,93,93,0.3)",
        }}
      >
        <span className="text-[var(--danger)] text-lg leading-none mt-0.5">⚠</span>
        <p className="text-[15px] text-[var(--fg-muted)] leading-relaxed">
          <span className="text-[var(--danger)] font-semibold">Handle with care.</span>{" "}
          These are the tools most likely to derail a live call. Reach for the
          battlecard — don&apos;t improvise. Never speculate on security specifics;
          route IT/Security questions to the security team.
        </p>
      </div>

      <div className="cc-scroll max-h-[500px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cards.map(({ id, intel, card }) => {
            const isOpen = open === id;
            return (
              <div
                key={id}
                className="cc-panel p-5"
                style={{
                  borderLeft: `3px solid ${
                    intel.level === "high"
                      ? "var(--danger)"
                      : intel.level === "medium"
                      ? "var(--orange)"
                      : "var(--green)"
                  }`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{card.heading}</h3>
                  <span className={`cc-pill cc-pill--${intel.level}`}>
                    {intel.level} threat
                  </span>
                </div>

                <p className="text-[var(--fg)] text-[14px] mb-3">{intel.what}</p>

                <div className="mb-3">
                  <div className="cc-label">Why it comes up</div>
                  <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
                    {card.signal}
                  </p>
                </div>

                <div
                  className="rounded-lg p-3 bg-[var(--surface)] mb-3"
                  style={{ borderLeft: "2px solid var(--green)" }}
                >
                  <div className="cc-label mb-1" style={{ color: "var(--green)" }}>
                    Counter
                  </div>
                  <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
                    {card.tip}
                  </p>
                </div>

                <button
                  className="cc-btn w-full"
                  onClick={() => setOpen(isOpen ? null : id)}
                >
                  {isOpen ? "Hide talk track" : "Full talk track"}
                </button>

                {isOpen && (
                  <p className="cc-enter mt-3 text-[var(--fg-muted)] text-[14px] leading-relaxed">
                    {card.talkTrack}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

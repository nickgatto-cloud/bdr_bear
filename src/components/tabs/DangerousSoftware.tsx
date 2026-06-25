import { useState } from "react";
import { TRADE_SOFTWARE, DEFAULT_SOFTWARE_NOTE } from "@/lib/dangerousSoftware";

export default function DangerousSoftware() {
  const [tradeId, setTradeId] = useState(TRADE_SOFTWARE[0].id);
  const [swIndex, setSwIndex] = useState(0);

  const trade = TRADE_SOFTWARE.find((t) => t.id === tradeId) ?? TRADE_SOFTWARE[0];
  const sw = trade.software[swIndex] ?? trade.software[0];
  const notes = sw.notes && sw.notes.length ? sw.notes : null;

  return (
    <div className="px-4 py-5 md:px-7 md:py-6">
      {/* warning banner */}
      <div
        className="rounded-lg p-4 mb-6 flex items-start gap-3"
        style={{
          background: "var(--danger-soft)",
          border: "1px solid rgba(250,144,22,0.3)",
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

      {/* trade first, then the software that trade tends to use */}
      <div className="cc-panel p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Trade</label>
            <select
              className="cc-field"
              value={tradeId}
              onChange={(e) => {
                setTradeId(e.target.value);
                setSwIndex(0);
              }}
            >
              {TRADE_SOFTWARE.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="cc-label">Software in use</label>
            <select
              className="cc-field"
              value={String(swIndex)}
              onChange={(e) => setSwIndex(Number(e.target.value))}
            >
              {trade.software.map((s, i) => (
                <option key={i} value={String(i)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* tailored card */}
      <div
        key={`${tradeId}:${swIndex}`}
        className="cc-panel p-6 cc-enter"
        style={{ borderLeft: "3px solid var(--orange)" }}
      >
        <div className="cc-label mb-1">{trade.label} using</div>
        <h3 className="text-xl font-semibold mb-4">{sw.name}</h3>

        {notes ? (
          <div
            className="rounded-lg p-4 bg-[var(--surface)]"
            style={{ borderLeft: "3px solid var(--denim)" }}
          >
            <div className="cc-label" style={{ color: "var(--denim)" }}>
              Ask / watch for
            </div>
            <ul className="space-y-2 mt-1">
              {notes.map((n, i) => (
                <li
                  key={i}
                  className="text-[var(--fg-muted)] text-[14px] leading-relaxed pl-4 relative"
                >
                  <span
                    className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--denim)" }}
                  />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div
            className="rounded-lg p-4 bg-[var(--surface)]"
            style={{ borderLeft: "3px solid var(--green)" }}
          >
            <div className="cc-label" style={{ color: "var(--green)" }}>
              Play
            </div>
            <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
              {DEFAULT_SOFTWARE_NOTE}
            </p>
          </div>
        )}
      </div>

      {trade.footnote && (
        <p className="mt-4 flex gap-2 text-[13px] text-[var(--fg-dim)] leading-relaxed">
          <span className="text-[var(--orange)] flex-none">†</span>
          <span>{trade.footnote}</span>
        </p>
      )}
    </div>
  );
}

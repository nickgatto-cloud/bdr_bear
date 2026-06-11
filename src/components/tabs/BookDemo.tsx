import { useState } from "react";
import { COACHING, chipsByCategory } from "@/lib/coaching";

const SLOTS = [
  "Tue 10:00 AM",
  "Tue 2:00 PM",
  "Wed 11:00 AM",
  "Thu 9:00 AM",
  "Thu 2:00 PM",
  "Fri 10:00 AM",
];

export interface BookDemoDefaults {
  tradeId?: string;
  roleId?: string;
  competitorId?: string;
}

export default function BookDemo({ defaults }: { defaults: BookDemoDefaults }) {
  const trades = chipsByCategory("trade");
  const roles = chipsByCategory("role").filter((c) => c.id !== "bid-volume");
  const competitors = chipsByCategory("competitor");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [tradeId, setTradeId] = useState(defaults.tradeId ?? "");
  const [roleId, setRoleId] = useState(defaults.roleId ?? "");
  const [competitorId, setCompetitorId] = useState(defaults.competitorId ?? "");
  const [slot, setSlot] = useState("");
  const [copied, setCopied] = useState(false);

  const tradeCard = tradeId ? COACHING[tradeId] : undefined;
  const compCard = competitorId ? COACHING[competitorId] : undefined;

  const focus =
    tradeCard?.tip ?? "Confirm their trade so you can tailor the live takeoff.";
  const compNote = compCard
    ? compCard.tip ?? compCard.signal
    : "Ask what they use today so you keep what works and add the takeoff engine.";

  const ready = Boolean(name.trim() && slot);
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const confirmation =
    `Hi ${firstName}, confirming your Togal.AI demo for ${slot || "[time]"}.\n\n` +
    `We'll run a live takeoff on one of ${company.trim() || "your team"}'s own plan sets — ` +
    `bring a drawing you're actively bidding. I'll focus on ` +
    `${tradeCard ? tradeCard.heading.toLowerCase() : "your trade"} so you see exactly how it fits your workflow.\n\n` +
    `It takes 15 minutes. Talk soon — [You]`;

  const copy = () => {
    navigator.clipboard?.writeText(confirmation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="px-7 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        {/* ---- form ---- */}
        <section>
          <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)] mb-4">
            DEMO DETAILS
          </h2>
          <div className="cc-panel p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="cc-label">Prospect name</label>
                <input
                  className="cc-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Lopez"
                />
              </div>
              <div>
                <label className="cc-label">Company</label>
                <input
                  className="cc-field"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Lopez Drywall Co."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="cc-label">Trade</label>
                <select
                  className="cc-field"
                  value={tradeId}
                  onChange={(e) => setTradeId(e.target.value)}
                >
                  <option value="">Select trade…</option>
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cc-label">Role</label>
                <select
                  className="cc-field"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="">Select role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="cc-label">Current takeoff tool</label>
              <select
                className="cc-field"
                value={competitorId}
                onChange={(e) => setCompetitorId(e.target.value)}
              >
                <option value="">Select tool…</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="cc-label">Suggested time</label>
              <div className="flex flex-wrap gap-3">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    className={`cc-slot ${slot === s ? "is-active" : ""}`}
                    onClick={() => setSlot(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- live brief ---- */}
        <section>
          <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)] mb-4">
            DEMO BRIEF
          </h2>
          <div className="cc-panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--fg)] text-lg font-semibold">
                {company.trim() || "New prospect"}
              </span>
              <span className={`cc-pill ${ready ? "cc-pill--ok" : "cc-pill--open"}`}>
                {ready ? "Ready to confirm" : "Incomplete"}
              </span>
            </div>

            <div>
              <div className="cc-label">Tailor the demo to</div>
              <p className="text-[var(--fg)] text-[15px]">
                {tradeCard ? tradeCard.heading : "their trade"}
                {roleId && COACHING[roleId]
                  ? ` · ${COACHING[roleId].heading}`
                  : ""}
              </p>
            </div>

            <div
              className="rounded-lg p-4 bg-[var(--surface)]"
              style={{ borderLeft: "3px solid var(--green)" }}
            >
              <div className="cc-label" style={{ color: "var(--green)" }}>
                Recommended focus
              </div>
              <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
                {focus}
              </p>
            </div>

            <div
              className="rounded-lg p-4 bg-[var(--surface)]"
              style={{ borderLeft: "3px solid var(--orange)" }}
            >
              <div className="cc-label" style={{ color: "var(--orange)" }}>
                {compCard ? `Vs. ${compCard.heading}` : "Incumbent tool"}
              </div>
              <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
                {compNote}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="cc-label mb-0">Confirmation message</div>
                <button className="cc-btn cc-btn--accent" onClick={copy}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 text-[var(--fg-muted)] text-[14px] leading-relaxed font-sans">
                {confirmation}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

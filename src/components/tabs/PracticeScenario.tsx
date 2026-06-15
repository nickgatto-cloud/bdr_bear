import { useEffect, useRef, useState } from "react";
import {
  SCENARIO_PROSPECT_TYPES,
  SCENARIO_OBJECTIONS,
  buildScenario,
  type Difficulty,
  type Scenario,
  type ScenarioObjection,
} from "@/lib/coaching";

const DIFFICULTIES: Difficulty[] = ["Easy", "Challenging", "Hard"];

interface Turn {
  role: "prospect" | "rep";
  text: string;
}

export default function PracticeScenario() {
  const [prospectType, setProspectType] = useState(SCENARIO_PROSPECT_TYPES[0]);
  const [objectionId, setObjectionId] = useState(SCENARIO_OBJECTIONS[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [objection, setObjection] = useState<ScenarioObjection | null>(null);
  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread, loading]);

  const start = () => {
    const obj =
      SCENARIO_OBJECTIONS.find((o) => o.id === objectionId) ??
      SCENARIO_OBJECTIONS[0];
    const sc = buildScenario(prospectType, obj, difficulty);
    setObjection(obj);
    setScenario(sc);
    setThread([{ role: "prospect", text: sc.opener }]);
    setInput("");
    setError(null);
  };

  const reset = () => {
    setScenario(null);
    setObjection(null);
    setThread([]);
    setInput("");
    setError(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !scenario) return;

    const newThread: Turn[] = [...thread, { role: "rep", text }];
    setThread(newThread);
    setInput("");
    setError(null);
    setLoading(true);

    // API messages: drop the opener (index 0), map rep→user / prospect→assistant.
    const messages = newThread.slice(1).map((t) => ({
      role: t.role === "rep" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    }));

    try {
      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectType,
          objection: objection?.label,
          difficulty,
          persona: scenario.persona,
          opener: scenario.opener,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
      } else if (data.reply) {
        setThread((t) => [...t, { role: "prospect", text: data.reply }]);
      }
    } catch {
      setError("Network error — couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="cc-label flex items-center gap-2">
        <RepeatIcon size={13} /> PRACTICE SCENARIO SETUP
      </div>

      <div className="cc-panel p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Prospect type</label>
            <select
              className="cc-field"
              value={prospectType}
              onChange={(e) => setProspectType(e.target.value)}
              disabled={!!scenario}
            >
              {SCENARIO_PROSPECT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="cc-label">Main objection</label>
            <select
              className="cc-field"
              value={objectionId}
              onChange={(e) => setObjectionId(e.target.value)}
              disabled={!!scenario}
            >
              {SCENARIO_OBJECTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="cc-label">Difficulty</label>
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`diff ${difficulty === d ? "is-active" : ""}`}
                onClick={() => !scenario && setDifficulty(d)}
                disabled={!!scenario}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {!scenario ? (
          <button className="btn-primary" onClick={start}>
            ▷ Start practice scenario ↗
          </button>
        ) : (
          <button className="cc-btn" onClick={reset}>
            ↻ New scenario
          </button>
        )}
      </div>

      {/* live role-play */}
      <div className="mt-5">
        {!scenario ? (
          <div className="flex flex-col items-center justify-center text-center py-10 text-[var(--fg-dim)]">
            <RepeatIcon size={26} />
            <p className="mt-3 text-[15px] max-w-md">
              Configure above and hit Start — Claude plays the prospect live,
              with coaching notes on the side.
            </p>
          </div>
        ) : (
          <div className="cc-enter grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            {/* chat */}
            <div className="cc-panel flex flex-col" style={{ height: 480 }}>
              <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-[var(--fg)] font-semibold text-[15px]">
                  Live role-play
                </span>
                <span className="text-[13px] text-[var(--fg-dim)]">
                  {scenario.title}
                </span>
              </div>

              <div
                ref={threadRef}
                className="cc-scroll flex-1 overflow-y-auto px-5 py-4 space-y-3"
              >
                {thread.map((t, i) => (
                  <Bubble key={i} turn={t} />
                ))}
                {loading && (
                  <div className="flex">
                    <div
                      className="rounded-lg px-4 py-2 text-[var(--fg-dim)] text-[14px] italic bg-[var(--surface)]"
                      style={{ borderLeft: "3px solid var(--denim)" }}
                    >
                      Prospect is thinking…
                    </div>
                  </div>
                )}
                {error && (
                  <div
                    className="rounded-lg px-4 py-2 text-[14px] leading-relaxed"
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid rgba(250,144,22,0.35)",
                      color: "#f6b86a",
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-[var(--border)] flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your response to the prospect…"
                  className="cc-field flex-1"
                  disabled={loading}
                />
                <button
                  className="btn-primary"
                  onClick={send}
                  disabled={loading || !input.trim()}
                >
                  Send ↗
                </button>
              </div>
            </div>

            {/* reference: persona + coaching */}
            <div className="space-y-4">
              <div
                className="cc-panel p-4"
                style={{ borderLeft: "3px solid var(--denim)" }}
              >
                <div className="cc-label" style={{ color: "var(--denim)" }}>
                  Persona
                </div>
                <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
                  {scenario.persona}
                </p>
              </div>
              <div
                className="cc-panel p-4"
                style={{ borderLeft: "3px solid var(--green)" }}
              >
                <div className="cc-label" style={{ color: "var(--green)" }}>
                  Coaching notes
                </div>
                <ul className="space-y-2 mt-1">
                  {scenario.coaching.map((c, i) => (
                    <li
                      key={i}
                      className="text-[var(--fg-muted)] text-[14px] leading-relaxed pl-4 relative"
                    >
                      <span
                        className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--green)" }}
                      />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const isRep = turn.role === "rep";
  return (
    <div className={`flex ${isRep ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-lg px-4 py-2.5"
        style={{
          background: isRep ? "var(--denim-soft)" : "var(--surface)",
          borderLeft: isRep ? undefined : "3px solid var(--denim)",
          border: isRep ? "1px solid var(--denim)" : undefined,
        }}
      >
        <div
          className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-1"
          style={{ color: isRep ? "#a9c8ff" : "var(--fg-dim)" }}
        >
          {isRep ? "You" : "Prospect"}
        </div>
        <p className="text-[var(--fg)] text-[15px] leading-relaxed">{turn.text}</p>
      </div>
    </div>
  );
}

function RepeatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

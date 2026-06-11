import { useState } from "react";
import {
  SCENARIO_PROSPECT_TYPES,
  SCENARIO_OBJECTIONS,
  buildScenario,
  type Difficulty,
  type Scenario,
} from "@/lib/coaching";

const DIFFICULTIES: Difficulty[] = ["Easy", "Challenging", "Hard"];

export default function PracticeScenario() {
  const [prospectType, setProspectType] = useState(SCENARIO_PROSPECT_TYPES[0]);
  const [objectionId, setObjectionId] = useState(SCENARIO_OBJECTIONS[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [scenario, setScenario] = useState<Scenario | null>(null);

  const start = () => {
    const obj =
      SCENARIO_OBJECTIONS.find((o) => o.id === objectionId) ??
      SCENARIO_OBJECTIONS[0];
    setScenario(buildScenario(prospectType, obj, difficulty));
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
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={start}>
          ▷ Start practice scenario ↗
        </button>
      </div>

      {/* result / empty state */}
      <div className="mt-5">
        {!scenario ? (
          <div className="flex flex-col items-center justify-center text-center py-10 text-[var(--fg-dim)]">
            <RepeatIcon size={26} />
            <p className="mt-3 text-[15px] max-w-md">
              Configure above and hit Start — Claude plays the prospect live with
              coaching notes
            </p>
          </div>
        ) : (
          <div className="cc-enter space-y-4">
            <div className="cc-label">{scenario.title}</div>

            <div
              className="cc-panel p-6"
              style={{ borderLeft: "3px solid var(--denim)" }}
            >
              <div className="cc-label" style={{ color: "var(--denim)" }}>
                Prospect opens with
              </div>
              <p className="text-2xl font-semibold leading-snug text-[var(--fg)]">
                “{scenario.opener}”
              </p>
            </div>

            <div className="cc-panel p-5">
              <div className="cc-label">Persona</div>
              <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
                {scenario.persona}
              </p>
            </div>

            <div
              className="cc-panel p-5"
              style={{ borderLeft: "3px solid var(--green)" }}
            >
              <div className="cc-label" style={{ color: "var(--green)" }}>
                Coaching notes
              </div>
              <ul className="space-y-2 mt-1">
                {scenario.coaching.map((c, i) => (
                  <li
                    key={i}
                    className="text-[var(--fg-muted)] text-[15px] leading-relaxed pl-4 relative"
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

            <p className="text-[13px] text-[var(--fg-dim)]">
              Scripted opener + notes for now. Live back-and-forth role-play with
              Claude is the next integration.
            </p>
          </div>
        )}
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

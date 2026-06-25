import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SCENARIO_PROSPECT_TYPES,
  SCENARIO_OBJECTIONS,
  buildScenario,
  analyzeTranscript,
  type Difficulty,
  type Scenario,
  type ScenarioObjection,
  type TranscriptAnalysis,
} from "@/lib/coaching";
import ReplaySummary, {
  KeyMoments,
  CoachGaps,
} from "@/components/tabs/ReplaySummary";
import { buildReportDoc, downloadDocx, stamp } from "@/lib/exportReport";

/* ---- Web Speech API (browser speech-to-text) — minimal local types ---- */
interface SpeechAlt {
  transcript: string;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlt;
}
interface SpeechResultList {
  readonly length: number;
  [index: number]: SpeechResult;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

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

  // ---- voice (push-to-talk via Space bar / mic button) ----
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const baseRef = useRef(""); // text already in the box when dictation started
  const finalRef = useRef(""); // accumulated finalized speech this session
  const inputRef = useRef("");

  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread, loading]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current || listeningRef.current) return;
    const existing = inputRef.current.trim();
    baseRef.current = existing ? existing + " " : "";
    finalRef.current = "";
    listeningRef.current = true;
    setListening(true);
    try {
      recRef.current.start();
    } catch {
      listeningRef.current = false;
      setListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (listeningRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  // create the browser speech-recognition engine once
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += seg + " ";
        else interim += seg;
      }
      setInput(
        (baseRef.current + finalRef.current + interim)
          .replace(/\s+/g, " ")
          .replace(/^\s+/, "")
      );
    };
    rec.onend = () => {
      listeningRef.current = false;
      setListening(false);
    };
    rec.onerror = () => {
      listeningRef.current = false;
      setListening(false);
    };
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  // hold Space to talk while a scenario is live and you're not typing in a field
  useEffect(() => {
    if (!scenario || !voiceSupported) return;
    const isField = (el: Element | null) => {
      const t = el?.tagName;
      return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isField(document.activeElement)) return;
      e.preventDefault();
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && ae.tagName === "BUTTON") ae.blur();
      startListening();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isField(document.activeElement)) return;
      e.preventDefault();
      stopListening();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [scenario, voiceSupported, startListening, stopListening]);

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
    stopListening();
    setScenario(null);
    setObjection(null);
    setThread([]);
    setInput("");
    setError(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !scenario) return;
    stopListening();

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

  // score the live thread in the same "Replay summary" format as Post-call
  const analysis = useMemo<TranscriptAnalysis | null>(() => {
    if (!thread.some((t) => t.role === "rep")) return null;
    const transcript = thread
      .map((t) => `${t.role === "rep" ? "Rep" : "Prospect"}: ${t.text}`)
      .join("\n");
    return analyzeTranscript(transcript);
  }, [thread]);

  const exportReport = async () => {
    if (!scenario || thread.length === 0) return;
    const now = new Date();
    const rolePlay = thread
      .map((t) => `${t.role === "rep" ? "You" : "Prospect"}: ${t.text}`)
      .join("\n");
    const doc = buildReportDoc({
      heading: "Togal Call Coach — Practice scenario",
      meta: [
        `Scenario: ${scenario.title}`,
        `Prospect: ${prospectType} · Objection: ${
          objection?.label ?? "—"
        } · Difficulty: ${difficulty}`,
      ],
      analysis,
      transcriptTitle: "Role-play transcript",
      transcript: rolePlay,
      exportedAt: now.toLocaleString(),
    });
    await downloadDocx(`togal-practice-${stamp(now)}.docx`, doc);
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
          <div className="flex gap-3 flex-wrap">
            <button className="cc-btn" onClick={reset}>
              ↻ New scenario
            </button>
            <button
              className="cc-btn"
              onClick={exportReport}
              disabled={thread.length === 0}
              title="Download the role-play + feedback as a text file"
            >
              <span className="inline-flex items-center gap-1.5">
                <DownloadIcon /> Export
              </span>
            </button>
          </div>
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
          <div className="cc-enter space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            {/* chat */}
            <div className="cc-panel flex flex-col h-[68vh] md:h-[480px]">
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

              <div className="px-4 py-3 border-t border-[var(--border)]">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={
                      listening
                        ? "Listening… speak now"
                        : "Type your response — or hold Space to talk…"
                    }
                    className="cc-field flex-1"
                    style={listening ? { borderColor: "var(--green)" } : undefined}
                    disabled={loading}
                  />
                  {voiceSupported && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        toggleListening();
                      }}
                      className="cc-btn"
                      title="Hold Space to talk, or click to toggle the mic"
                      aria-label={listening ? "Stop voice input" : "Start voice input"}
                      style={
                        listening
                          ? { borderColor: "var(--green)", color: "var(--green)" }
                          : undefined
                      }
                    >
                      <MicIcon active={listening} />
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={send}
                    disabled={loading || !input.trim()}
                  >
                    Send ↗
                  </button>
                </div>

                <div className="mt-2 text-[12px] text-[var(--fg-dim)] flex items-center gap-2 min-h-[16px]">
                  {listening ? (
                    <span
                      className="flex items-center gap-1.5"
                      style={{ color: "var(--green)" }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--green)",
                          display: "inline-block",
                        }}
                      />
                      Listening — release Space to stop, then Send
                    </span>
                  ) : voiceSupported ? (
                    <span>
                      Hold{" "}
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          border: "1px solid var(--border-strong)",
                          background: "var(--surface)",
                        }}
                      >
                        Space
                      </span>{" "}
                      to talk (when not typing), or click the mic. Review, then Send.
                    </span>
                  ) : (
                    <span>
                      Voice input isn&apos;t supported in this browser — try Chrome or
                      Edge.
                    </span>
                  )}
                </div>
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

            {analysis && (
              <div className="space-y-5">
                <div>
                  <div className="cc-label">Your scorecard</div>
                  <ReplaySummary analysis={analysis} />
                </div>
                <KeyMoments analysis={analysis} />
                <CoachGaps analysis={analysis} />
              </div>
            )}
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

function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" fill="none" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
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

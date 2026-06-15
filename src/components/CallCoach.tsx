"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CHIPS,
  COACHING,
  FANT,
  VESTT,
  SEED_TRANSCRIPT,
  matchUtterance,
  buildAction,
  type Chip,
  type CoachingCard,
  type FantKey,
  type VesttKey,
  type GuidanceBlock,
} from "@/lib/coaching";
import BookDemo from "@/components/tabs/BookDemo";
import FantQualify from "@/components/tabs/FantQualify";
import CallScript from "@/components/tabs/CallScript";
import RolePlays from "@/components/tabs/RolePlays";
import DangerousSoftware from "@/components/tabs/DangerousSoftware";
import { CALL_STATE_KEY, clearPersistedCall } from "@/lib/storage";
import {
  Panel,
  SectionLabel,
  HeadsetIcon,
  CalendarIcon,
  TargetIcon,
  ScriptIcon,
  ChatIcon,
  AlertIcon,
  ResetIcon,
} from "@/components/ui";

type TabId = "live" | "book-demo" | "fant" | "script" | "roleplay" | "danger";

const NAV: {
  id: TabId;
  label: string;
  desc: string;
  icon: ReactNode;
  danger?: boolean;
}[] = [
  { id: "live", label: "Live Coach", desc: "Real-time objection handling and coaching", icon: <HeadsetIcon /> },
  { id: "book-demo", label: "Book Demo", desc: "Route the prospect to the right BDR", icon: <CalendarIcon /> },
  { id: "fant", label: "FANT Qualify", desc: "Fit · Authority · Need · Timing scorecard", icon: <TargetIcon /> },
  { id: "script", label: "Call Script", desc: "The VESTT motion, stage by stage", icon: <ScriptIcon /> },
  { id: "roleplay", label: "Role Plays", desc: "Drills, post-call analysis, and live practice", icon: <ChatIcon /> },
  { id: "danger", label: "Dangerous Software", desc: "Competitor watch list by trade", icon: <AlertIcon />, danger: true },
];

const ACTIONS: { id: string; label: string }[] = [
  { id: "book-demo", label: "Book demo" },
  { id: "fant-vestt", label: "FANT+VESTT brief" },
  { id: "demo-close", label: "Demo close" },
  { id: "battlecard", label: "Battlecard" },
  { id: "follow-up", label: "Follow-up" },
];

/** Build the structured call-notes from the currently active chips (live). */
function buildNotesFields(
  activeChips: Set<string>
): { label: string; value: string }[] {
  const active = CHIPS.filter((c) => activeChips.has(c.id));
  const inCat = (cat: string) => active.filter((c) => c.category === cat);
  const heading = (c: Chip) => COACHING[c.id]?.heading ?? c.label;
  const DASH = "—";

  const roles = inCat("role")
    .filter((c) => c.id !== "bid-volume")
    .map((c) => c.label.replace(/\s*role$/i, ""));
  const trades = inCat("trade");
  const isGC = trades.some((c) => c.id === "gc");
  const tradeNames = trades.filter((c) => c.id !== "gc").map(heading);
  const software = inCat("competitor").map(heading);

  return [
    { label: "Contact's Role", value: roles.length ? roles.join(", ") : DASH },
    {
      label: "Company Type",
      value: isGC
        ? "General Contractor"
        : trades.length
        ? "Specialty / Subcontractor"
        : DASH,
    },
    {
      label: "Company Trade(s)",
      value: tradeNames.length
        ? tradeNames.join(", ")
        : isGC
        ? "General (multi-trade)"
        : DASH,
    },
    { label: "Current Software", value: software.length ? software.join(", ") : DASH },
  ];
}

const ESTIMATOR_OPTIONS = ["1", "2", "3", "4", "5", "6+"];

interface TranscriptLine {
  id: number;
  speaker: "PROSPECT";
  text: string;
}

interface GuidanceEntry extends GuidanceBlock {
  key: number;
  accent: "green" | "orange" | "denim" | "purple" | "neutral";
  sourceChipId?: string;
  /** the toolbar action this card came from; re-clicking that action removes it */
  sourceActionId?: string;
  /** chip cards split out context vs. the recommended reply (emphasised) */
  signal?: string;
  reply?: string;
  tip?: string;
}

const ACCENT_BY_CATEGORY: Record<string, GuidanceEntry["accent"]> = {
  competitor: "orange",
  trade: "green",
  role: "denim",
  tech: "denim",
  security: "denim",
  objection: "neutral",
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallCoach() {
  const [tab, setTab] = useState<TabId>("live");
  const [resetNonce, setResetNonce] = useState(0);

  const [seconds, setSeconds] = useState(5 * 60 + 19);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const [transcript, setTranscript] = useState<TranscriptLine[]>(() =>
    SEED_TRANSCRIPT.map((text, i) => ({ id: i, speaker: "PROSPECT", text }))
  );
  const nextLineId = useRef(SEED_TRANSCRIPT.length);

  const [draft, setDraft] = useState("");

  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  // editable notes fields (the rest of the notes auto-fill from chips)
  const [estimatingTeam, setEstimatingTeam] = useState("");
  const [estimators, setEstimators] = useState("");
  const [fant, setFant] = useState<Record<FantKey, boolean>>({
    F: false,
    A: true,
    N: true,
    T: true,
  });
  const [vestt, setVestt] = useState<Record<VesttKey, boolean>>({
    V: false,
    E: false,
    S: false,
    T1: false,
    T2: false,
  });

  const [guidance, setGuidance] = useState<GuidanceEntry[]>([]);
  const guidanceKey = useRef(0);
  const guidanceRef = useRef<HTMLDivElement>(null);

  // ----- persistence -----
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CALL_STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.transcript) && s.transcript.length) {
          setTranscript(s.transcript);
          nextLineId.current =
            Math.max(...s.transcript.map((l: TranscriptLine) => l.id)) + 1;
        }
        if (typeof s.draft === "string") setDraft(s.draft);
        if (Array.isArray(s.activeChips)) setActiveChips(new Set(s.activeChips));
        if (Array.isArray(s.activeActions))
          setActiveActions(
            new Set(s.activeActions.filter((a: string) => a !== "notes"))
          );
        if (s.fant) setFant(s.fant);
        if (s.vestt) setVestt(s.vestt);
        if (Array.isArray(s.guidance)) {
          const restored = s.guidance.filter(
            (g: GuidanceEntry) => g.sourceActionId !== "notes"
          );
          setGuidance(restored);
          guidanceKey.current = restored.length
            ? Math.max(...restored.map((g: GuidanceEntry) => g.key)) + 1
            : 0;
        }
        if (typeof s.estimatingTeam === "string")
          setEstimatingTeam(s.estimatingTeam);
        if (typeof s.estimators === "string") setEstimators(s.estimators);
        if (typeof s.seconds === "number") setSeconds(s.seconds);
        if (typeof s.tab === "string") setTab(s.tab);
      }
    } catch {
      /* ignore malformed storage */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        CALL_STATE_KEY,
        JSON.stringify({
          transcript,
          draft,
          activeChips: [...activeChips],
          activeActions: [...activeActions],
          estimatingTeam,
          estimators,
          fant,
          vestt,
          guidance,
          seconds,
          tab,
        })
      );
    } catch {
      /* ignore */
    }
  }, [
    transcript,
    draft,
    activeChips,
    activeActions,
    estimatingTeam,
    estimators,
    fant,
    vestt,
    guidance,
    seconds,
    tab,
  ]);

  const lastByCategory = useCallback(
    (cat: string): CoachingCard | undefined => {
      const ids = [...activeChips].reverse();
      for (const id of ids) {
        const card = COACHING[id];
        if (card && card.category === cat) return card;
      }
      return undefined;
    },
    [activeChips]
  );

  const ctx = useMemo(
    () => ({
      competitor: lastByCategory("competitor"),
      trade: lastByCategory("trade"),
      role: lastByCategory("role"),
      fant,
      vestt,
    }),
    [lastByCategory, fant, vestt]
  );

  const applyCardToFrameworks = useCallback((card: CoachingCard) => {
    if (card.fant?.length) {
      setFant((prev) => {
        const next = { ...prev };
        for (const k of card.fant!) next[k] = true;
        return next;
      });
    }
    if (card.vestt?.length) {
      setVestt((prev) => {
        const next = { ...prev };
        for (const k of card.vestt!) next[k] = true;
        return next;
      });
    }
  }, []);

  const pushCard = useCallback(
    (card: CoachingCard, sourceChipId?: string) => {
      const entry: GuidanceEntry = {
        key: guidanceKey.current++,
        sourceChipId,
        tag: card.tag,
        heading: card.heading,
        accent: ACCENT_BY_CATEGORY[card.category] ?? "neutral",
        signal: card.signal,
        reply: card.talkTrack,
        tip: card.tip,
        body: [],
      };
      setGuidance((g) =>
        sourceChipId && g.some((e) => e.sourceChipId === sourceChipId)
          ? g
          : [entry, ...g]
      );
      applyCardToFrameworks(card);
    },
    [applyCardToFrameworks]
  );

  const pushBlock = useCallback(
    (block: GuidanceBlock, accent: GuidanceEntry["accent"] = "green") => {
      setGuidance((g) => [{ key: guidanceKey.current++, accent, ...block }, ...g]);
    },
    []
  );

  const handleChip = useCallback(
    (chip: Chip) => {
      const isActive = activeChips.has(chip.id);
      setActiveChips((prev) => {
        const next = new Set(prev);
        if (next.has(chip.id)) next.delete(chip.id);
        else next.add(chip.id);
        return next;
      });
      if (isActive) {
        setGuidance((g) => g.filter((e) => e.sourceChipId !== chip.id));
      } else {
        const card = COACHING[chip.id];
        if (card) pushCard(card, chip.id);
      }
    },
    [activeChips, pushCard]
  );

  const handleAnalyze = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const line: TranscriptLine = {
      id: nextLineId.current++,
      speaker: "PROSPECT",
      text,
    };
    setTranscript((t) => [...t, line]);
    const card = matchUtterance(text);
    if (card) {
      setActiveChips((prev) => new Set(prev).add(card.id));
      pushCard(card, card.id);
    } else {
      pushBlock(
        {
          tag: "Listen",
          heading: "No objection pattern detected",
          body: [
            `Logged: "${text}"`,
            `Keep them talking — ask an open question to surface the real driver, then tap the closest chip for a battlecard or rebuttal.`,
          ],
        },
        "neutral"
      );
    }
    setDraft("");
  }, [draft, pushCard, pushBlock]);

  const handleAction = useCallback(
    (actionId: string) => {
      const isActive = activeActions.has(actionId);
      setActiveActions((prev) => {
        const next = new Set(prev);
        if (next.has(actionId)) next.delete(actionId);
        else next.add(actionId);
        return next;
      });
      if (isActive) {
        // deselecting → clear this action's card from the window
        setGuidance((g) => g.filter((e) => e.sourceActionId !== actionId));
        return;
      }
      const block = buildAction(actionId, ctx);
      const accent: GuidanceEntry["accent"] =
        actionId === "battlecard"
          ? "orange"
          : actionId === "follow-up"
          ? "denim"
          : "green";
      setGuidance((g) => [
        { key: guidanceKey.current++, accent, sourceActionId: actionId, ...block },
        ...g,
      ]);
      if (actionId === "book-demo" || actionId === "demo-close") {
        setVestt((v) => ({ ...v, T2: true }));
      }
    },
    [activeActions, ctx]
  );

  const handleReset = useCallback(() => {
    setTranscript(
      SEED_TRANSCRIPT.map((text, i) => ({
        id: i,
        speaker: "PROSPECT" as const,
        text,
      }))
    );
    nextLineId.current = SEED_TRANSCRIPT.length;
    setActiveChips(new Set());
    setActiveActions(new Set());
    setEstimatingTeam("");
    setEstimators("");
    setFant({ F: false, A: true, N: true, T: true });
    setVestt({ V: false, E: false, S: false, T1: false, T2: false });
    setGuidance([]);
    setDraft("");
    setSeconds(5 * 60 + 19);
    clearPersistedCall();
    setResetNonce((n) => n + 1);
  }, []);

  const toggleFant = (k: FantKey) => setFant((f) => ({ ...f, [k]: !f[k] }));
  const toggleVestt = (k: VesttKey) => setVestt((v) => ({ ...v, [k]: !v[k] }));
  const setFantValue = useCallback(
    (k: FantKey, v: boolean) => setFant((f) => ({ ...f, [k]: v })),
    []
  );
  const setVesttValue = useCallback(
    (k: VesttKey, v: boolean) => setVestt((prev) => ({ ...prev, [k]: v })),
    []
  );

  const active = NAV.find((n) => n.id === tab) ?? NAV[0];

  return (
    <div className="cc-app">
      {/* ---------- sidebar ---------- */}
      <aside className="cc-sidebar">
        <div className="cc-brand">
          <span className="cc-brand-dot" aria-hidden />
          <div className="leading-tight">
            <div className="text-[16px] font-bold tracking-tight">
              Togal<span style={{ color: "var(--green)" }}>.AI</span>
            </div>
            <div className="text-[11px] text-[var(--fg-dim)] font-medium">
              Call Coach · v7.1
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 cc-stagger">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`cc-nav ${n.danger ? "cc-nav--danger" : ""} ${
                tab === n.id ? "is-active" : ""
              }`}
              onClick={() => setTab(n.id)}
            >
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-3">
          <p className="px-2 text-[12px] leading-snug text-[var(--fg-dim)]">
            <span className="text-[var(--fg-muted)] font-medium">
              Takeoff in Minutes.
            </span>{" "}
            Not Days.
          </p>
          <button className="cc-reset" onClick={handleReset}>
            <ResetIcon size={15} /> Reset session
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <main className="cc-main">
        <header className="cc-topbar">
          <div>
            <h1 className="text-xl font-semibold leading-tight">{active.label}</h1>
            <p className="text-[13px] text-[var(--fg-muted)]">{active.desc}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="cc-clock">{formatClock(seconds)}</span>
            <span className="cc-livepill">
              <span className="dot" /> Live
            </span>
          </div>
        </header>

        <div className="cc-content">
          {tab === "live" ? (
            <LiveCoach
              transcript={transcript}
              draft={draft}
              setDraft={setDraft}
              activeChips={activeChips}
              onChip={handleChip}
              onAnalyze={handleAnalyze}
              onAction={handleAction}
              activeActions={activeActions}
              estimatingTeam={estimatingTeam}
              setEstimatingTeam={setEstimatingTeam}
              estimators={estimators}
              setEstimators={setEstimators}
              guidance={guidance}
              guidanceRef={guidanceRef}
              fant={fant}
              vestt={vestt}
              toggleFant={toggleFant}
              toggleVestt={toggleVestt}
            />
          ) : (
            <div className="cc-scroll h-full overflow-y-auto cc-enter">
              {tab === "book-demo" && <BookDemo />}
              {tab === "fant" && (
                <FantQualify key={resetNonce} fant={fant} setFantValue={setFantValue} />
              )}
              {tab === "script" && (
                <CallScript vestt={vestt} setVesttValue={setVesttValue} />
              )}
              {tab === "roleplay" && <RolePlays key={resetNonce} />}
              {tab === "danger" && <DangerousSoftware />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================================================================== */
/*  Live coach — full-height two-column                                */
/* ================================================================== */

function LiveCoach({
  transcript,
  draft,
  setDraft,
  activeChips,
  onChip,
  onAnalyze,
  onAction,
  activeActions,
  estimatingTeam,
  setEstimatingTeam,
  estimators,
  setEstimators,
  guidance,
  guidanceRef,
  fant,
  vestt,
  toggleFant,
  toggleVestt,
}: {
  transcript: TranscriptLine[];
  draft: string;
  setDraft: (s: string) => void;
  activeChips: Set<string>;
  onChip: (c: Chip) => void;
  onAnalyze: () => void;
  onAction: (id: string) => void;
  activeActions: Set<string>;
  estimatingTeam: string;
  setEstimatingTeam: (v: string) => void;
  estimators: string;
  setEstimators: (v: string) => void;
  guidance: GuidanceEntry[];
  guidanceRef: React.RefObject<HTMLDivElement | null>;
  fant: Record<FantKey, boolean>;
  vestt: Record<VesttKey, boolean>;
  toggleFant: (k: FantKey) => void;
  toggleVestt: (k: VesttKey) => void;
}) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [coachingTab, setCoachingTab] = useState<"guidance" | "notes">(
    "guidance"
  );
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  return (
    <div className="h-full px-7 py-6">
      <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- left: live input ---- */}
        <section className="flex flex-col min-h-0">
          <div className="flex items-baseline justify-between mb-2.5">
            <SectionLabel className="mb-0">Live input</SectionLabel>
            <span className="text-[12px] text-[var(--fg-dim)]">
              Prospect transcript
            </span>
          </div>

          <div
            ref={transcriptRef}
            className="cc-panel cc-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
          >
            {transcript.map((line) => (
              <div
                key={line.id}
                className="rounded-lg bg-[var(--surface)] border-l-2 border-[var(--border-strong)] px-4 py-3"
              >
                <div className="text-[10px] font-semibold tracking-[0.14em] text-[var(--fg-dim)] mb-1.5">
                  {line.speaker}
                </div>
                <div className="text-[var(--fg)] text-[16px] leading-snug">
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex-none">
            <SectionLabel>Tag what you hear</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  className={`chip ${activeChips.has(chip.id) ? "is-active" : ""}`}
                  data-variant={chip.category}
                  onClick={() => onChip(chip)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3 flex-none">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAnalyze();
              }}
              placeholder="Type the prospect's objection or topic…"
              className="cc-field flex-1 text-[16px]"
            />
            <button className="btn-analyze" onClick={onAnalyze}>
              Analyze <span className="opacity-60">↗</span>
            </button>
          </div>
        </section>

        {/* ---- right: coaching + notes ---- */}
        <section className="flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] mb-3">
            <div className="flex gap-5">
              <button
                className={`subtab ${coachingTab === "guidance" ? "is-active" : ""}`}
                onClick={() => setCoachingTab("guidance")}
              >
                Coaching
              </button>
              <button
                className={`subtab ${coachingTab === "notes" ? "is-active" : ""}`}
                onClick={() => setCoachingTab("notes")}
              >
                Notes
              </button>
            </div>
            {coachingTab === "guidance" && (
              <span className="text-[12px] text-[var(--fg-dim)]">
                {guidance.length} {guidance.length === 1 ? "card" : "cards"}
              </span>
            )}
          </div>

          {coachingTab === "guidance" ? (
            <>
              <div className="flex gap-2 overflow-x-auto cc-scroll pb-2 mb-3 flex-none">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    className={`action-btn ${activeActions.has(a.id) ? "is-active" : ""}`}
                    onClick={() => onAction(a.id)}
                  >
                    {a.label} <span className="opacity-50">↗</span>
                  </button>
                ))}
              </div>

              <div
                ref={guidanceRef}
                className="cc-panel cc-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
              >
                {guidance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center px-8">
                    <p className="text-[var(--fg-dim)] text-[15px] max-w-sm leading-relaxed">
                      Tap a chip or analyze what the prospect said. Live talk
                      tracks, battlecards, and next steps land here — newest
                      first.
                    </p>
                  </div>
                ) : (
                  guidance.map((g) => <GuidanceCard key={g.key} entry={g} />)
                )}
              </div>
            </>
          ) : (
            <div className="cc-panel cc-scroll flex-1 min-h-0 overflow-y-auto p-5">
              <div
                className="text-[11px] font-semibold tracking-[0.11em] uppercase mb-4"
                style={{ color: "var(--green)" }}
              >
                Call notes
              </div>
              <div className="space-y-3">
                {buildNotesFields(activeChips).map((f, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-[15px] leading-relaxed border-b border-[var(--border)] pb-3"
                  >
                    <span className="text-[var(--fg-dim)] font-medium min-w-[150px] flex-none">
                      {f.label}
                    </span>
                    <span className="text-[var(--fg)]">{f.value}</span>
                  </div>
                ))}

                <div className="flex gap-3 items-center text-[15px] border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--fg-dim)] font-medium min-w-[150px] flex-none">
                    Estimating team
                  </span>
                  <select
                    className="cc-field"
                    style={{ maxWidth: 180 }}
                    value={estimatingTeam}
                    onChange={(e) => setEstimatingTeam(e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="flex gap-3 items-center text-[15px]">
                  <span className="text-[var(--fg-dim)] font-medium min-w-[150px] flex-none">
                    Estimators
                  </span>
                  <select
                    className="cc-field"
                    style={{ maxWidth: 180 }}
                    value={estimators}
                    onChange={(e) => setEstimators(e.target.value)}
                  >
                    <option value="">—</option>
                    {ESTIMATOR_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[13px] text-[var(--fg-dim)] mt-6 leading-relaxed">
                Role, company type, trade(s), and current software auto-fill from
                the chips you tag on the left. Set the estimating team and
                headcount here.
              </p>
            </div>
          )}

          <Panel className="mt-4 p-4 flex-none">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-12 text-[11px] font-semibold tracking-[0.11em] text-[var(--fg-muted)]">
                FANT
              </span>
              {FANT.map((f) => (
                <button
                  key={f.key}
                  className={`tag tag--fant ${fant[f.key] ? "is-on" : ""}`}
                  title={f.hint}
                  onClick={() => toggleFant(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-3">
              <span className="w-12 text-[11px] font-semibold tracking-[0.11em] text-[var(--fg-muted)]">
                VESTT
              </span>
              {VESTT.map((v) => (
                <button
                  key={v.key}
                  className={`tag tag--vestt ${vestt[v.key] ? "is-on" : ""}`}
                  title={`${v.full} — ${v.hint}`}
                  onClick={() => toggleVestt(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

const ACCENT_HEX: Record<GuidanceEntry["accent"], string> = {
  green: "var(--green)",
  orange: "var(--orange)",
  denim: "var(--denim)",
  purple: "var(--purple)",
  neutral: "var(--border-strong)",
};

function GuidanceCard({
  entry,
  notesFields,
}: {
  entry: GuidanceEntry;
  notesFields?: { label: string; value: string }[];
}) {
  return (
    <div
      className="cc-enter rounded-lg bg-[var(--surface)] border border-[var(--border)] px-5 py-4"
      style={{ borderLeft: `3px solid ${ACCENT_HEX[entry.accent]}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full"
          style={{
            color: ACCENT_HEX[entry.accent],
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {entry.tag}
        </span>
      </div>
      <h3 className="text-[var(--fg)] text-lg font-semibold mb-2">
        {entry.heading}
      </h3>
      {notesFields && (
        <div className="space-y-1.5">
          {notesFields.map((f, i) => (
            <div key={i} className="flex gap-2 text-[14px] leading-relaxed">
              <span className="text-[var(--fg-dim)] font-medium min-w-[124px] flex-none">
                {f.label}
              </span>
              <span className="text-[var(--fg)]">{f.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {entry.signal && (
          <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
            <span className="text-[var(--fg-dim)] font-medium">Signal: </span>
            {entry.signal}
          </p>
        )}
        {entry.reply && (
          <div
            className="rounded-md px-3 py-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderLeft: `2px solid ${ACCENT_HEX[entry.accent]}`,
            }}
          >
            <div
              className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1"
              style={{ color: ACCENT_HEX[entry.accent] }}
            >
              Say this
            </div>
            <p className="text-[var(--fg)] text-[15px] font-semibold leading-relaxed">
              {entry.reply}
            </p>
          </div>
        )}
        {entry.tip && (
          <p className="text-[var(--fg-muted)] text-[14px] leading-relaxed">
            <span className="text-[var(--fg-dim)] font-medium">Tip: </span>
            {entry.tip}
          </p>
        )}
        {entry.body.map((b, i) => (
          <p key={i} className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
            {b}
          </p>
        ))}
      </div>
    </div>
  );
}

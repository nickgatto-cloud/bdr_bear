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
  COMPARISONS,
  buildAction,
  matchUtterance,
  PRACTICE_LINES,
  type Chip,
  type CoachingCard,
  type Comparison,
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
  { id: "live", label: "The Bear's Den", desc: "Real-time objection handling and coaching", icon: <HeadsetIcon /> },
  { id: "book-demo", label: "Book Demo", desc: "Route the prospect to the right BDR", icon: <CalendarIcon /> },
  { id: "fant", label: "FANT Qualify", desc: "Fit · Authority · Need · Timing scorecard", icon: <TargetIcon /> },
  { id: "script", label: "Call Script", desc: "The VESTT motion, stage by stage", icon: <ScriptIcon /> },
  { id: "roleplay", label: "Role Plays", desc: "Drills, post-call analysis, and live practice", icon: <ChatIcon /> },
  { id: "danger", label: "Dangerous Software", desc: "Competitor watch list by trade", icon: <AlertIcon />, danger: true },
];

const ACTIONS: { id: string; label: string }[] = [
  { id: "book-demo", label: "Book demo" },
  { id: "demo-close", label: "Demo close" },
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
  /** set when the line was logged by tagging a chip — removed if untagged */
  chipId?: string;
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
  /** chip category — routes the card to the left (competitor) or right column */
  category?: string;
  /** competitor id used to look up its Togal-vs-X comparison table */
  competitorId?: string;
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

  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  // captured prospect lines — not shown live; surfaced in Post-call analysis
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const nextLineId = useRef(0);
  const [draft, setDraft] = useState("");
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
        if (Array.isArray(s.transcript)) {
          setTranscript(s.transcript);
          nextLineId.current = s.transcript.length
            ? Math.max(...s.transcript.map((l: TranscriptLine) => l.id)) + 1
            : 0;
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
        category: card.category,
        competitorId: card.category === "competitor" ? card.id : undefined,
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
        // deselect → drop the card and any transcript line this chip logged
        setGuidance((g) => g.filter((e) => e.sourceChipId !== chip.id));
        setTranscript((t) => t.filter((l) => l.chipId !== chip.id));
      } else {
        const card = COACHING[chip.id];
        if (card) pushCard(card, chip.id);
        // tagging something the prospect said also logs it to the transcript
        const heard = PRACTICE_LINES[chip.id];
        if (heard) {
          setTranscript((t) => [
            ...t,
            {
              id: nextLineId.current++,
              speaker: "PROSPECT",
              text: heard,
              chipId: chip.id,
            },
          ]);
        }
      }
    },
    [activeChips, pushCard]
  );

  const [asking, setAsking] = useState(false);

  // free-form Q&A grounded in the Togal knowledge base (server-side Claude)
  const askAI = useCallback(async (question: string) => {
    setAsking(true);
    const key = guidanceKey.current++;
    // optimistic "thinking" card, replaced in place when the answer returns
    setGuidance((g) => [
      {
        key,
        accent: "denim",
        tag: "Answer",
        heading: question.length > 70 ? question.slice(0, 68) + "…" : question,
        body: ["Thinking…"],
      },
      ...g,
    ]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      const ok = res.ok && !data.error && typeof data.answer === "string";
      setGuidance((g) =>
        g.map((e) =>
          e.key === key
            ? ok
              ? { ...e, reply: data.answer as string, body: [] }
              : { ...e, body: [data.error ?? "Couldn't get an answer."] }
            : e
        )
      );
    } catch {
      setGuidance((g) =>
        g.map((e) =>
          e.key === key
            ? { ...e, body: ["Network error — couldn't reach the server."] }
            : e
        )
      );
    } finally {
      setAsking(false);
    }
  }, []);

  // analyze bar: tag chips for heard objections, OR answer free-form questions
  const handleAnalyze = useCallback(() => {
    const text = draft.trim();
    if (!text || asking) return;
    setDraft("");
    const card = matchUtterance(text);
    const isQuestion =
      /\?\s*$/.test(text) ||
      /^(what|how|why|when|who|which|where|does|do|can|is|are|should|would|could|will|tell me|explain|give me|help|compare)\b/i.test(
        text
      );
    // surface the matching battlecard / comparison either way
    if (card) {
      setActiveChips((prev) => new Set(prev).add(card.id));
      pushCard(card, card.id);
    }
    // log heard prospect lines to the transcript (questions aren't prospect speech)
    if (!isQuestion) {
      setTranscript((t) => [
        ...t,
        { id: nextLineId.current++, speaker: "PROSPECT", text },
      ]);
    }
    // answer free-form questions, or anything we couldn't map to a chip
    if (isQuestion || !card) {
      askAI(text);
    }
  }, [draft, asking, pushCard, askAI]);

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
    setTranscript([]);
    nextLineId.current = 0;
    setDraft("");
    setActiveChips(new Set());
    setActiveActions(new Set());
    setEstimatingTeam("");
    setEstimators("");
    setFant({ F: false, A: true, N: true, T: true });
    setVestt({ V: false, E: false, S: false, T1: false, T2: false });
    setGuidance([]);
    setSeconds(0);
    clearPersistedCall();
    setResetNonce((n) => n + 1);
  }, []);

  const setFantValue = useCallback(
    (k: FantKey, v: boolean) => setFant((f) => ({ ...f, [k]: v })),
    []
  );
  const setVesttValue = useCallback(
    (k: VesttKey, v: boolean) => setVestt((prev) => ({ ...prev, [k]: v })),
    []
  );

  // formatted for the Post-call analysis transcript box
  const liveTranscriptText = useMemo(
    () => transcript.map((l) => `Prospect: ${l.text}`).join("\n"),
    [transcript]
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
              activeChips={activeChips}
              onChip={handleChip}
              onAction={handleAction}
              activeActions={activeActions}
              draft={draft}
              setDraft={setDraft}
              onAnalyze={handleAnalyze}
              asking={asking}
              estimatingTeam={estimatingTeam}
              setEstimatingTeam={setEstimatingTeam}
              estimators={estimators}
              setEstimators={setEstimators}
              guidance={guidance}
              guidanceRef={guidanceRef}
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
              {tab === "roleplay" && (
                <RolePlays key={resetNonce} liveTranscript={liveTranscriptText} />
              )}
              {tab === "danger" && <DangerousSoftware />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================================================================== */
/*  Live coach — coaching/notes window on top, chip rail below         */
/* ================================================================== */

function LiveCoach({
  activeChips,
  onChip,
  onAction,
  activeActions,
  draft,
  setDraft,
  onAnalyze,
  asking,
  estimatingTeam,
  setEstimatingTeam,
  estimators,
  setEstimators,
  guidance,
  guidanceRef,
}: {
  activeChips: Set<string>;
  onChip: (c: Chip) => void;
  onAction: (id: string) => void;
  activeActions: Set<string>;
  draft: string;
  setDraft: (s: string) => void;
  onAnalyze: () => void;
  asking: boolean;
  estimatingTeam: string;
  setEstimatingTeam: (v: string) => void;
  estimators: string;
  setEstimators: (v: string) => void;
  guidance: GuidanceEntry[];
  guidanceRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [coachingTab, setCoachingTab] = useState<"guidance" | "notes">(
    "guidance"
  );
  const [copied, setCopied] = useState(false);
  const [feedH, setFeedH] = useState<number | null>(null);
  const chipsRef = useRef<HTMLElement>(null);

  // assemble the notes as a plain-text block (for pasting into HubSpot)
  const buildNotesText = () => {
    const lines = buildNotesFields(activeChips).map((f) => `${f.label}: ${f.value}`);
    lines.push(`Estimating team: ${estimatingTeam || "—"}`);
    lines.push(`Estimators: ${estimators || "—"}`);
    return lines.join("\n");
  };

  const copyNotes = async () => {
    const text = buildNotesText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for browsers / non-secure contexts without the clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else we can do */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  // selecting + copying inside the notes card should also yield plain text —
  // never the styled card, which HubSpot would paste as a formatted block
  const handleNotesCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = buildNotesText();
    e.clipboardData.setData("text/plain", text);
    e.clipboardData.setData(
      "text/html",
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")
    );
  };

  // drag the resize grip to grow/shrink the feed; double-click resets to fill
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = guidanceRef.current?.offsetHeight ?? 400;
    // cap the height so the panel can never grow over the chip rail below it
    const wrapperTop = guidanceRef.current?.getBoundingClientRect().top ?? 0;
    const chipsH = chipsRef.current?.offsetHeight ?? 0;
    const maxH = Math.max(240, window.innerHeight - wrapperTop - chipsH - 48);
    const move = (ev: PointerEvent) =>
      setFeedH(Math.min(maxH, Math.max(240, startH + (ev.clientY - startY))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  // feed fills by default (flex-1); once resized it takes an explicit height
  const sectionFill = coachingTab === "notes" || feedH === null;

  return (
    <div className="h-full px-7 py-6 flex flex-col min-h-0 gap-5">
      {/* ---- top: coaching + notes (full width) ---- */}
      <section className={`flex flex-col min-h-0 ${sectionFill ? "flex-1" : ""}`}>
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
              className={`relative ${feedH === null ? "flex-1 min-h-0" : ""}`}
              style={feedH !== null ? { height: feedH } : undefined}
            >
              <div
                ref={guidanceRef}
                className="cc-panel cc-scroll h-full overflow-y-auto p-4"
              >
              {guidance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-8">
                  <p className="text-[var(--fg-dim)] text-[15px] max-w-md leading-relaxed">
                    Tap a chip below or fire a quick action above. Competitor
                    comparisons land on the left; objections, trades, and roles
                    on the right — newest first.
                  </p>
                </div>
              ) : (
                (() => {
                  const comps = guidance.filter((g) => g.category === "competitor");
                  const others = guidance.filter((g) => g.category !== "competitor");
                  if (comps.length > 0 && others.length > 0) {
                    return (
                      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-4 items-start">
                        <div className="space-y-3">
                          {comps.map((g, i) => renderGuidance(g, i === 0))}
                        </div>
                        <div className="space-y-3">
                          {others.map((g, i) => (
                            <BulletCard key={g.key} entry={g} isNew={i === 0} />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  const list = comps.length > 0 ? comps : others;
                  return (
                    <div className="space-y-3 max-w-3xl">
                      {list.map((g, i) => renderGuidance(g, i === 0))}
                    </div>
                  );
                })()
              )}
              </div>
              <div
                onPointerDown={startResize}
                onDoubleClick={() => setFeedH(null)}
                title="Drag to resize · double-click to reset"
                aria-label="Resize panel"
                className="cc-resize"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M12 5L5 12M12 9L9 12"
                    stroke="var(--fg-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div
            className="cc-panel cc-scroll flex-1 min-h-0 overflow-y-auto p-5"
            onCopy={handleNotesCopy}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className="text-[11px] font-semibold tracking-[0.11em] uppercase"
                style={{ color: "var(--green)" }}
              >
                Call notes
              </div>
              <button
                className="cc-btn"
                onClick={copyNotes}
                title="Copy these notes to paste into HubSpot"
              >
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
                  style={{ marginRight: 6, verticalAlign: -2 }}
                >
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                {copied ? "Copied ✓" : "Copy for HubSpot"}
              </button>
            </div>
            <div className="space-y-3 max-w-2xl">
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
            <p className="text-[13px] text-[var(--fg-dim)] mt-6 leading-relaxed max-w-2xl">
              Role, company type, trade(s), and current software auto-fill from
              the chips you tag below. Set the estimating team and headcount
              here.
            </p>
          </div>
        )}
      </section>

      {/* ---- bottom: tag what you hear (full width) ---- */}
      <section ref={chipsRef} className="flex-none">
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

        <div className="mt-3 flex gap-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAnalyze();
            }}
            placeholder="Type what you heard, or ask anything…"
            className="cc-field flex-1 text-[16px]"
            disabled={asking}
          />
          <button
            className="btn-analyze"
            onClick={onAnalyze}
            disabled={asking || !draft.trim()}
          >
            {asking ? "Thinking…" : "Analyze"} <span className="opacity-60">↗</span>
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[var(--fg-dim)]">
          Tags the matching chip for objections, and answers any question from
          Togal&apos;s playbook, studies, and case studies. Heard lines also log
          to the transcript under Role Plays → Post-call analysis.
        </p>
      </section>
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

/** Split a talk track into one-sentence bullets (no lookbehind, for browser safety). */
function toBullets(text: string): string[] {
  return text
    .replace(/([.?!])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Competitor with a comparison table → table; everything else → bullet card. */
function renderGuidance(g: GuidanceEntry, isNew: boolean) {
  const comp = g.competitorId ? COMPARISONS[g.competitorId] : undefined;
  return comp ? (
    <ComparisonCard key={g.key} comparison={comp} isNew={isNew} />
  ) : (
    <BulletCard key={g.key} entry={g} isNew={isNew} />
  );
}

function NewBadge() {
  return (
    <span
      className="text-[9px] font-semibold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full"
      style={{ color: "var(--bg)", background: "var(--green)" }}
    >
      New
    </span>
  );
}

function BulletCard({ entry, isNew }: { entry: GuidanceEntry; isNew?: boolean }) {
  const accent = ACCENT_HEX[entry.accent];
  const bullets = entry.reply ? toBullets(entry.reply) : entry.body;
  return (
    <div
      className="cc-enter rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {isNew && <NewBadge />}
        <span
          className="text-[10px] font-semibold tracking-[0.09em] uppercase px-2 py-0.5 rounded-full"
          style={{ color: accent, background: "rgba(255,255,255,0.05)" }}
        >
          {entry.tag}
        </span>
        <h3 className="text-[var(--fg)] text-[15px] font-semibold leading-tight">
          {entry.heading}
        </h3>
      </div>

      {entry.signal && (
        <p className="text-[11px] text-[var(--fg-dim)] leading-snug mb-2">
          {entry.signal}
        </p>
      )}

      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-snug">
            <span className="flex-none mt-[2px]" style={{ color: accent }}>
              •
            </span>
            <span
              className={
                i === 0 ? "text-[var(--fg)] font-semibold" : "text-[var(--fg-muted)]"
              }
            >
              {b}
            </span>
          </li>
        ))}
      </ul>

      {entry.tip && (
        <p className="text-[11px] text-[var(--fg-dim)] leading-snug mt-2">
          <span className="font-medium">Tip: </span>
          {entry.tip}
        </p>
      )}
    </div>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="var(--green)" />
      <path
        d="M7 12.5l3.3 3.3L17 9"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--fg-dim)" strokeWidth="1.4" />
      <path
        d="M8.7 8.7l6.6 6.6M15.3 8.7l-6.6 6.6"
        stroke="var(--fg-dim)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ComparisonCard({
  comparison,
  isNew,
}: {
  comparison: Comparison;
  isNew?: boolean;
}) {
  const accent = ACCENT_HEX.orange;
  const cols = { gridTemplateColumns: "1fr 48px 64px" } as const;
  return (
    <div
      className="cc-enter rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        {isNew && <NewBadge />}
        <span
          className="text-[10px] font-semibold tracking-[0.09em] uppercase px-2 py-0.5 rounded-full"
          style={{ color: accent, background: "rgba(255,255,255,0.05)" }}
        >
          Comparison
        </span>
        <h3 className="text-[var(--fg)] text-[15px] font-semibold leading-tight">
          Togal vs {comparison.them}
        </h3>
      </div>

      {comparison.proof && (
        <p className="text-[11px] text-[var(--fg-dim)] leading-snug mb-2.5">
          Proof: {comparison.proof}
        </p>
      )}

      <div
        className="grid items-center pb-1.5 mb-0.5 border-b border-[var(--border-strong)]"
        style={cols}
      >
        <span className="text-[11px] text-[var(--fg-dim)]">Feature</span>
        <span
          className="text-[11px] font-semibold text-center"
          style={{ color: "var(--green)" }}
        >
          Togal
        </span>
        <span className="text-[11px] text-[var(--fg-muted)] text-center">
          {comparison.them}
        </span>
      </div>

      {comparison.rows.map((r, i) => (
        <div
          key={i}
          className="grid items-center py-[6px] border-b border-[var(--border)]"
          style={cols}
        >
          <span className="text-[13px] text-[var(--fg-muted)] leading-snug pr-2">
            {r.feature}
          </span>
          <span className="flex justify-center">
            <Mark on={r.togal} />
          </span>
          <span className="flex justify-center">
            <Mark on={r.them} />
          </span>
        </div>
      ))}
    </div>
  );
}

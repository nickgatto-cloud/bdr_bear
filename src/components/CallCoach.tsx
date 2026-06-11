"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type TabId = "live" | "book-demo" | "fant" | "script" | "roleplay" | "danger";

const TABS: { id: TabId; label: string; danger?: boolean }[] = [
  { id: "live", label: "Live coach" },
  { id: "book-demo", label: "Book demo" },
  { id: "fant", label: "FANT qualify" },
  { id: "script", label: "Call script" },
  { id: "roleplay", label: "Role plays" },
  { id: "danger", label: "Dangerous software", danger: true },
];

const ACTIONS: { id: string; label: string }[] = [
  { id: "book-demo", label: "Book demo" },
  { id: "fant-vestt", label: "FANT+VESTT brief" },
  { id: "demo-close", label: "Demo close" },
  { id: "battlecard", label: "Battlecard" },
  { id: "follow-up", label: "Follow-up" },
];

interface TranscriptLine {
  id: number;
  speaker: "PROSPECT";
  text: string;
}

interface GuidanceEntry extends GuidanceBlock {
  key: number;
  accent: "green" | "orange" | "denim" | "purple" | "neutral";
}

const ACCENT_BY_CATEGORY: Record<string, GuidanceEntry["accent"]> = {
  competitor: "orange",
  trade: "green",
  role: "denim",
  tech: "purple",
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
  // bumped on Reset to force the child tabs (FANT scorecard, role plays) to remount fresh
  const [resetNonce, setResetNonce] = useState(0);

  // call timer — starts at 05:19 like the screenshot, ticks up
  const [seconds, setSeconds] = useState(5 * 60 + 19);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // transcript
  const [transcript, setTranscript] = useState<TranscriptLine[]>(() =>
    SEED_TRANSCRIPT.map((text, i) => ({ id: i, speaker: "PROSPECT", text }))
  );
  const nextLineId = useRef(SEED_TRANSCRIPT.length);

  // input
  const [draft, setDraft] = useState("");

  // selections
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [fant, setFant] = useState<Record<FantKey, boolean>>({
    // seed matches the screenshot: A, N, T lit; F not yet
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

  // guidance feed (newest first)
  const [guidance, setGuidance] = useState<GuidanceEntry[]>([]);
  const guidanceKey = useRef(0);
  const guidanceRef = useRef<HTMLDivElement>(null);

  // ----- persistence: restore an in-progress call on load, mirror to storage -----
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
        if (s.fant) setFant(s.fant);
        if (s.vestt) setVestt(s.vestt);
        if (Array.isArray(s.guidance)) {
          setGuidance(s.guidance);
          guidanceKey.current = s.guidance.length
            ? Math.max(...s.guidance.map((g: GuidanceEntry) => g.key)) + 1
            : 0;
        }
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
  }, [transcript, draft, activeChips, fant, vestt, guidance, seconds, tab]);

  // derived context for action scripts
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
    (card: CoachingCard) => {
      const entry: GuidanceEntry = {
        key: guidanceKey.current++,
        tag: card.tag,
        heading: card.heading,
        accent: ACCENT_BY_CATEGORY[card.category] ?? "neutral",
        body: [
          `Signal: ${card.signal}`,
          card.talkTrack,
          ...(card.tip ? [`Tip: ${card.tip}`] : []),
        ],
      };
      setGuidance((g) => [entry, ...g]);
      applyCardToFrameworks(card);
    },
    [applyCardToFrameworks]
  );

  const pushBlock = useCallback(
    (block: GuidanceBlock, accent: GuidanceEntry["accent"] = "green") => {
      setGuidance((g) => [
        { key: guidanceKey.current++, accent, ...block },
        ...g,
      ]);
    },
    []
  );

  // ----- handlers -----
  const handleChip = useCallback(
    (chip: Chip) => {
      setActiveChips((prev) => {
        const next = new Set(prev);
        if (next.has(chip.id)) next.delete(chip.id);
        else next.add(chip.id);
        return next;
      });
      const card = COACHING[chip.id];
      if (card && !activeChips.has(chip.id)) pushCard(card);
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
      // reflect the detected topic in the chip rail too
      setActiveChips((prev) => new Set(prev).add(card.id));
      pushCard(card);
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
      setTab("live"); // guidance renders on the live tab
      const block = buildAction(actionId, ctx);
      const accent: GuidanceEntry["accent"] =
        actionId === "battlecard"
          ? "orange"
          : actionId === "follow-up"
          ? "denim"
          : "green";
      pushBlock(block, accent);
      // a couple of actions advance the VESTT trial-close
      if (actionId === "book-demo" || actionId === "demo-close") {
        setVestt((v) => ({ ...v, T2: true }));
      }
    },
    [ctx, pushBlock]
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
    setFant({ F: false, A: true, N: true, T: true });
    setVestt({ V: false, E: false, S: false, T1: false, T2: false });
    setGuidance([]);
    setDraft("");
    setSeconds(5 * 60 + 19);
    clearPersistedCall();
    setResetNonce((n) => n + 1);
  }, []);

  const toggleFant = (k: FantKey) =>
    setFant((f) => ({ ...f, [k]: !f[k] }));
  const toggleVestt = (k: VesttKey) =>
    setVestt((v) => ({ ...v, [k]: !v[k] }));
  const setFantValue = useCallback(
    (k: FantKey, v: boolean) => setFant((f) => ({ ...f, [k]: v })),
    []
  );
  const setVesttValue = useCallback(
    (k: VesttKey, v: boolean) => setVestt((prev) => ({ ...prev, [k]: v })),
    []
  );

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] p-4 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-[1480px] rounded-2xl bg-[var(--app)] border border-[var(--border)] shadow-2xl overflow-hidden">
        {/* ---------- header ---------- */}
        <header className="flex items-center justify-between px-7 pt-6 pb-3">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-block w-3 h-3 rounded-full bg-[var(--green)] translate-y-[1px]"
              style={{ boxShadow: "0 0 10px var(--green)" }}
              aria-hidden
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Togal Call Coach
            </h1>
            <span className="text-[var(--fg-dim)] text-base">v7.1</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--fg-muted)] text-lg tabular-nums font-mono">
              {formatClock(seconds)}
            </span>
            <span className="px-4 py-1 rounded-full border border-[var(--danger)] text-[var(--danger)] text-sm font-semibold">
              Live
            </span>
          </div>
        </header>

        {/* ---------- tabs ---------- */}
        <nav className="flex items-center gap-8 px-7 border-b border-[var(--border)] pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`cc-tab ${t.id === tab ? "is-active" : ""} ${
                t.danger ? "cc-tab--danger" : ""
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "live" && (
          <LiveCoach
            transcript={transcript}
            draft={draft}
            setDraft={setDraft}
            activeChips={activeChips}
            onChip={handleChip}
            onAnalyze={handleAnalyze}
            guidance={guidance}
            guidanceRef={guidanceRef}
            fant={fant}
            vestt={vestt}
            toggleFant={toggleFant}
            toggleVestt={toggleVestt}
          />
        )}
        {tab === "book-demo" && (
          <BookDemo
            defaults={{
              tradeId: ctx.trade?.id,
              roleId: ctx.role?.id,
              competitorId: ctx.competitor?.id,
            }}
          />
        )}
        {tab === "fant" && (
          <FantQualify
            key={resetNonce}
            fant={fant}
            setFantValue={setFantValue}
          />
        )}
        {tab === "script" && (
          <CallScript vestt={vestt} setVesttValue={setVesttValue} />
        )}
        {tab === "roleplay" && <RolePlays key={resetNonce} />}
        {tab === "danger" && <DangerousSoftware />}

        {/* ---------- action bar ---------- */}
        <div className="px-7 pt-5 pb-7 border-t border-[var(--border)] space-y-4">
          <div className="flex gap-4 flex-wrap">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                className="action-btn"
                onClick={() => handleAction(a.id)}
              >
                {a.label} <span className="text-[var(--fg-dim)]">↗</span>
              </button>
            ))}
          </div>
          <div>
            <button className="action-btn action-btn--reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Live coach tab                                                     */
/* ================================================================== */

function LiveCoach({
  transcript,
  draft,
  setDraft,
  activeChips,
  onChip,
  onAnalyze,
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
  guidance: GuidanceEntry[];
  guidanceRef: React.RefObject<HTMLDivElement | null>;
  fant: Record<FantKey, boolean>;
  vestt: Record<VesttKey, boolean>;
  toggleFant: (k: FantKey) => void;
  toggleVestt: (k: VesttKey) => void;
}) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 px-7 py-6">
      {/* ---------- left: live input ---------- */}
      <section className="flex flex-col min-h-0">
        <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)] mb-4">
          LIVE INPUT
        </h2>

        <div
          ref={transcriptRef}
          className="cc-scroll h-[330px] overflow-y-auto pr-3 space-y-3"
        >
          {transcript.map((line) => (
            <div
              key={line.id}
              className="rounded-lg bg-[var(--panel)] border-l-2 border-[var(--border-strong)] px-5 py-4"
            >
              <div className="text-xs font-semibold tracking-[0.12em] text-[var(--fg-dim)] mb-2">
                {line.speaker}
              </div>
              <div className="text-[var(--fg)] text-lg leading-snug">
                {line.text}
              </div>
            </div>
          ))}
        </div>

        {/* chip rail */}
        <div className="flex flex-wrap gap-3 mt-5">
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

        {/* input row */}
        <div className="flex gap-4 mt-6">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAnalyze();
            }}
            placeholder="Type prospect's objection or topic…"
            className="cc-scroll flex-1 rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-5 py-4 text-xl text-[var(--fg)] placeholder:text-[var(--fg-dim)] outline-none focus:border-[var(--green)] transition-colors"
          />
          <button className="btn-analyze" onClick={onAnalyze}>
            Analyze <span className="text-[var(--fg-dim)]">↗</span>
          </button>
        </div>
      </section>

      {/* ---------- right: coaching guidance ---------- */}
      <section className="flex flex-col min-h-0">
        <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)] mb-4">
          COACHING GUIDANCE
        </h2>

        <div
          ref={guidanceRef}
          className="cc-scroll h-[430px] overflow-y-auto pr-3 rounded-lg bg-[var(--panel)] border border-[var(--border)] p-4 space-y-3"
        >
          {guidance.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-6">
              <p className="text-[var(--fg-dim)] text-base max-w-sm leading-relaxed">
                Tap a chip or analyze what the prospect said. Live talk tracks,
                battlecards, and next steps appear here.
              </p>
            </div>
          ) : (
            guidance.map((g) => <GuidanceCard key={g.key} entry={g} />)
          )}
        </div>

        {/* framework trackers */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-16 text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)]">
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-16 text-sm font-semibold tracking-[0.12em] text-[var(--fg-muted)]">
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
        </div>
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

function GuidanceCard({ entry }: { entry: GuidanceEntry }) {
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
      <div className="space-y-2">
        {entry.body.map((b, i) => (
          <p
            key={i}
            className="text-[var(--fg-muted)] text-[15px] leading-relaxed"
          >
            {b}
          </p>
        ))}
      </div>
    </div>
  );
}

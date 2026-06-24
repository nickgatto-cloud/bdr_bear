"use client";

import { useCallback, useEffect, useState } from "react";

interface HubContact {
  name: string | null;
  company: string | null;
  jobTitle: string | null;
}
interface HubSpotCall {
  id: string;
  title: string;
  timestamp: string | null;
  durationMs: number | null;
  direction: string | null;
  status: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  externalNumber: string | null;
  internalNumber: string | null;
  recordingUrl: string | null;
  hubspotUrl: string | null;
  body: string;
  hubspot: HubContact | null;
}

function fmtWhen(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function fmtDur(ms: number | null): string {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

/**
 * The unified call log: recent calls come from HubSpot; clicking one pulls the
 * actual transcript from the telephony provider (Quo / Aircall) by phone number,
 * falling back to HubSpot's own call notes when no transcript exists.
 */
export default function HubSpotCalls({
  onLoad,
}: {
  onLoad: (text: string, recordingUrl?: string | null) => void;
}) {
  const [calls, setCalls] = useState<HubSpotCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // phone-number search → finds calls beyond the recent 20
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HubSpotCall[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchedFor, setSearchedFor] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hubspot/calls", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) setError(data?.error || `Couldn't load calls (${res.status}).`);
      else setCalls(Array.isArray(data.calls) ? data.calls : []);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/hubspot/calls?number=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error || `Search failed (${res.status}).`);
      else {
        setResults(Array.isArray(data.calls) ? data.calls : []);
        setSearchedFor(q);
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setResults(null);
    setQuery("");
    setSearchedFor("");
  };

  // show search results when a search is active, otherwise the recent feed
  const shown = results ?? calls;

  const open = async (c: HubSpotCall) => {
    if (busyId) return;
    setSelectedId(c.id);

    const headerLines = [
      `HubSpot call — ${c.title}`,
      c.hubspot?.name
        ? `Contact: ${c.hubspot.name}${c.hubspot.company ? ` · ${c.hubspot.company}` : ""}`
        : null,
      [c.direction, fmtWhen(c.timestamp), fmtDur(c.durationMs)]
        .filter(Boolean)
        .join(" · ") || null,
    ].filter(Boolean);
    const header = headerLines.join("\n");
    const notes = c.body ? `\n\nNotes from HubSpot:\n${c.body}` : "";
    // the link rides alongside via onLoad's 2nd arg so the transcript box stays
    // clean — prefer the HubSpot record page (opens the call in HubSpot), falling
    // back to the raw recording URL if we couldn't build the record link
    const emit = (text: string) => onLoad(text, c.hubspotUrl ?? c.recordingUrl);

    // no number to bridge on — just load whatever HubSpot has
    if (!c.externalNumber) {
      emit(`${header}${notes || "\n\n(No transcript or notes for this call.)"}`);
      return;
    }

    setBusyId(c.id);
    emit(`${header}\n\nPulling transcript from Quo / Aircall…`);
    try {
      const q = new URLSearchParams({ number: c.externalNumber });
      if (c.internalNumber) q.set("internal", c.internalNumber);
      const res = await fetch(`/api/call-data?${q.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.transcript) {
        const label = data.source === "quo" ? "Quo" : data.source === "aircall" ? "Aircall" : "transcript";
        emit(`${header}\n\n--- Transcript (${label}) ---\n${data.transcript}`);
      } else {
        emit(
          `${header}\n\n(No transcript found in Quo or Aircall for this number.)${notes}`
        );
      }
    } catch {
      emit(`${header}\n\n(Couldn't reach the provider.)${notes}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="cc-panel p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="cc-label" style={{ margin: 0, color: "var(--orange)" }}>
          Recent calls (HubSpot)
        </div>
        <button className="cc-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* search any phone number — reaches calls beyond the recent list */}
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder="Search a phone number…"
          className="cc-field cc-field--accent flex-1"
        />
        <button
          className="cc-btn"
          onClick={runSearch}
          disabled={searching || !query.trim()}
        >
          {searching ? "Searching…" : "Search"}
        </button>
        {results !== null && (
          <button className="cc-btn" onClick={clearSearch} title="Back to recent calls">
            Clear
          </button>
        )}
      </div>

      {results !== null && !error && (
        <div className="text-[12px] text-[var(--fg-dim)] mb-2">
          {results.length === 0
            ? `No calls found for “${searchedFor}”.`
            : `${results.length} ${results.length === 1 ? "match" : "matches"} for “${searchedFor}”`}
        </div>
      )}

      {error ? (
        <p className="text-[14px] text-[var(--danger)] leading-relaxed">{error}</p>
      ) : (loading || searching) && shown.length === 0 ? (
        <p className="text-[14px] text-[var(--fg-dim)]">
          {searching ? "Searching…" : "Loading recent calls…"}
        </p>
      ) : shown.length === 0 ? (
        results !== null ? null : (
          <p className="text-[14px] text-[var(--fg-dim)]">No recent calls found.</p>
        )
      ) : (
        <div className="cc-scroll max-h-[260px] overflow-y-auto space-y-2 pr-1">
          {shown.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c)}
              className={`block w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                selectedId === c.id
                  ? "border-[var(--orange)] bg-[rgba(255,255,255,0.04)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
              }`}
              title="Load this call — pulls the transcript from Quo / Aircall"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] text-[var(--fg)] font-medium truncate">
                  {c.hubspot?.name || c.title}
                </span>
                <span className="text-[12px] text-[var(--fg-dim)] shrink-0">
                  {fmtWhen(c.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[12px] text-[var(--fg-dim)] flex-wrap">
                {c.direction && <span>{c.direction.toLowerCase()}</span>}
                {c.durationMs ? <span>· {fmtDur(c.durationMs)}</span> : null}
                {c.hubspot?.company && (
                  <span className="text-[var(--fg-muted)]">· {c.hubspot.company}</span>
                )}
                {c.recordingUrl && <span>· recording</span>}
                {c.body && <span>· notes</span>}
                {c.hubspot && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                    style={{ color: "var(--orange)", border: "1px solid var(--orange)" }}
                  >
                    HubSpot
                  </span>
                )}
                {busyId === c.id && <span>· pulling transcript…</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

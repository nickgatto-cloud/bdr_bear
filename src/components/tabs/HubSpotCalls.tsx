"use client";

import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 30_000;

interface HubSpotCall {
  id: string;
  title: string;
  timestamp: string | null;
  durationMs: number | null;
  direction: string | null;
  recordingUrl: string | null;
  body: string;
}

function fmtTime(ts: string | null): string {
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

function fmtDuration(ms: number | null): string {
  if (!ms) return "";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Lists the 20 most recent HubSpot calls and auto-refreshes every 30s.
 * Clicking a call loads its notes into the transcript box via `onLoad`.
 */
export default function HubSpotCalls({
  onLoad,
}: {
  onLoad: (text: string) => void;
}) {
  const [calls, setCalls] = useState<HubSpotCall[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hubspot/calls", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        setCalls([]);
      } else {
        setCalls(Array.isArray(data.calls) ? data.calls : []);
        setError(null);
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
      setUpdatedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const select = (c: HubSpotCall) => {
    setSelectedId(c.id);
    const header = `Call: ${c.title}${c.timestamp ? ` — ${fmtTime(c.timestamp)}` : ""}`;
    onLoad(
      c.body
        ? `${header}\n\n${c.body}`
        : `${header}\n\n(No call notes logged in HubSpot${
            c.recordingUrl ? " — recording linked in the calls list." : "."
          })`
    );
  };

  return (
    <div className="cc-panel p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="cc-label" style={{ margin: 0, color: "var(--orange)" }}>
          Recent HubSpot calls
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--fg-dim)]">
          {updatedAt && (
            <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>
          )}
          <span>· auto-refreshes every 30s</span>
          <button className="cc-btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-[14px] text-[var(--danger)] leading-relaxed">{error}</p>
      ) : loading && calls.length === 0 ? (
        <p className="text-[14px] text-[var(--fg-dim)]">Loading recent calls…</p>
      ) : calls.length === 0 ? (
        <p className="text-[14px] text-[var(--fg-dim)]">No recent calls found.</p>
      ) : (
        <div className="cc-scroll max-h-[240px] overflow-y-auto space-y-2 pr-1">
          {calls.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border px-3 py-2 transition-colors ${
                selectedId === c.id
                  ? "border-[var(--denim)] bg-[var(--denim-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
              }`}
            >
              <button
                className="text-left w-full"
                onClick={() => select(c)}
                title="Load this call's notes into the transcript box"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[14px] text-[var(--fg)] truncate">
                    {c.title}
                  </span>
                  <span className="text-[12px] text-[var(--fg-dim)] flex-none">
                    {fmtTime(c.timestamp)}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--fg-muted)] flex flex-wrap gap-x-2 mt-0.5">
                  {c.direction && <span>{c.direction.toLowerCase()}</span>}
                  {c.durationMs ? <span>· {fmtDuration(c.durationMs)}</span> : null}
                  <span>· {c.body ? "notes" : "no notes"}</span>
                </div>
              </button>
              {c.recordingUrl && (
                <a
                  href={c.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 text-[12px]"
                  style={{ color: "var(--green)" }}
                >
                  ▶ recording
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

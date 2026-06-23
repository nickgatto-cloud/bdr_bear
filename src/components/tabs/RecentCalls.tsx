"use client";

import { useCallback, useEffect, useState } from "react";

interface AircallCall {
  id: number;
  direction: string | null;
  number: string | null;
  contactName: string | null;
  startedAt: string | null;
  durationSec: number | null;
  status: string | null;
  missed: boolean;
  hasRecording: boolean;
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
function fmtDur(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

/**
 * Lists the most recent Aircall calls. Clicking one loads its transcript (or a
 * summary, if Aircall has no transcript for it) into the transcript box.
 */
export default function RecentCalls({
  onLoad,
}: {
  onLoad: (text: string) => void;
}) {
  const [calls, setCalls] = useState<AircallCall[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aircall/calls", { cache: "no-store" });
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
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const select = async (c: AircallCall) => {
    setSelectedId(c.id);
    setBusyId(c.id);
    const who = c.contactName || c.number || "Unknown";
    const header = `Aircall — ${c.direction ?? "call"} · ${who}${
      c.startedAt ? ` · ${fmtTime(c.startedAt)}` : ""
    }${c.durationSec ? ` · ${fmtDur(c.durationSec)}` : ""}`;
    try {
      const res = await fetch(`/api/aircall/transcript?id=${c.id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.transcript) {
        onLoad(`${header}\n\n${data.transcript}`);
      } else {
        onLoad(
          `${header}\n\n(${data.reason || "No transcript available for this call."})`
        );
      }
    } catch {
      onLoad(`${header}\n\n(Couldn't load the transcript — try again.)`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="cc-panel p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="cc-label" style={{ margin: 0, color: "var(--denim)" }}>
          Recent Aircall calls
        </div>
        <button className="cc-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
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
            <button
              key={c.id}
              onClick={() => select(c)}
              className={`block w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                selectedId === c.id
                  ? "border-[var(--denim)] bg-[var(--denim-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
              }`}
              title="Load this call's transcript into the box below"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[14px] text-[var(--fg)] truncate">
                  {c.contactName || c.number || "Unknown number"}
                </span>
                <span className="text-[12px] text-[var(--fg-dim)] flex-none">
                  {fmtTime(c.startedAt)}
                </span>
              </div>
              <div className="text-[12px] text-[var(--fg-muted)] flex flex-wrap gap-x-2 mt-0.5">
                {c.direction && <span>{c.direction}</span>}
                {c.durationSec ? <span>· {fmtDur(c.durationSec)}</span> : null}
                {c.missed && <span>· missed</span>}
                {c.hasRecording && <span>· recording</span>}
                {busyId === c.id && <span>· loading transcript…</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Resolves the actual call media (transcript) for a phone number by checking the
// telephony providers — Quo first, then Aircall. Used after a call is picked from
// the HubSpot call log (HubSpot stores the recording URL but not transcript text).
// All provider auth is server-side only.
//
// Quo's /v1/calls is scoped to a single phone number, so we target the org Quo
// number that matches the HubSpot call's Togal-side number (1 request) and only
// fall back to a sequential sweep if that misses. Sequential — NOT Promise.all —
// because Quo rate-limits bursts and silently drops the concurrent results.
import { AIRCALL_BASE, aircallAuth } from "@/lib/aircall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUO_BASE = "https://api.quo.com";

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}
function toE164(raw: string): string {
  const d = digits(raw);
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return raw.trim().startsWith("+") ? raw.trim() : `+${d}`;
}
function last10(s: string): string {
  return digits(s).slice(-10);
}

/* ---------- Quo ---------- */
function quoTranscript(j: unknown): string | null {
  const data = (j as { data?: { dialogue?: { content?: string }[] } })?.data;
  const dialogue = data?.dialogue;
  if (Array.isArray(dialogue) && dialogue.length) {
    const text = dialogue.map((d) => (d.content ?? "").trim()).filter(Boolean).join("\n");
    return text || null;
  }
  return null;
}

async function quoCallsFor(pid: string, e164: string, key: string) {
  const url = `${QUO_BASE}/v1/calls?phoneNumberId=${encodeURIComponent(
    pid
  )}&participants=${encodeURIComponent(e164)}&maxResults=10`;
  const r = await fetch(url, { headers: { Authorization: key }, cache: "no-store" });
  if (!r.ok) return [] as { id: string; createdAt?: string }[];
  const j = (await r.json()) as { data?: { id: string; createdAt?: string }[] };
  return Array.isArray(j.data) ? j.data : [];
}

async function quoTranscriptFor(callId: string, key: string): Promise<string | null> {
  const tr = await fetch(
    `${QUO_BASE}/v1/call-transcripts/${encodeURIComponent(callId)}`,
    { headers: { Authorization: key }, cache: "no-store" }
  );
  return tr.ok ? quoTranscript(await tr.json()) : null;
}

async function tryQuo(e164: string, internal: string | null): Promise<string | null> {
  const key = process.env.QUO_API_KEY;
  if (!key) return null;
  try {
    const pnRes = await fetch(`${QUO_BASE}/v1/phone-numbers`, {
      headers: { Authorization: key },
      cache: "no-store",
    });
    if (!pnRes.ok) return null;
    const pnJson = (await pnRes.json()) as {
      data?: { id?: string; number?: string; formattedNumber?: string }[];
    };
    const nums = (pnJson.data ?? []).filter((p) => p.id) as {
      id: string;
      number?: string;
      formattedNumber?: string;
    }[];

    // order: the phone number matching the HubSpot call's Togal-side number first
    const intl10 = internal ? last10(internal) : "";
    const ordered = intl10
      ? [...nums].sort((a, b) => {
          const am = last10(a.number ?? a.formattedNumber ?? "") === intl10 ? 0 : 1;
          const bm = last10(b.number ?? b.formattedNumber ?? "") === intl10 ? 0 : 1;
          return am - bm;
        })
      : nums;

    // sequential, early-exit — avoids Quo's burst rate-limit
    for (const p of ordered) {
      const calls = await quoCallsFor(p.id, e164, key);
      if (!calls.length) continue;
      calls.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      for (const c of calls.slice(0, 5)) {
        const t = await quoTranscriptFor(c.id, key);
        if (t) return t;
      }
      // matched the number but no transcript yet — keep checking other lines
    }
  } catch {
    /* fall through to Aircall */
  }
  return null;
}

/* ---------- Aircall ---------- */
function aircallTranscript(j: unknown): string | null {
  const content = (
    j as { transcription?: { content?: { utterances?: { text?: string }[] } | string } }
  )?.transcription?.content;
  if (content && typeof content === "object" && Array.isArray(content.utterances)) {
    const t = content.utterances.map((u) => (u.text ?? "").trim()).filter(Boolean).join("\n");
    return t || null;
  }
  if (typeof content === "string") return content.trim() || null;
  return null;
}

async function tryAircall(e164: string): Promise<string | null> {
  const auth = aircallAuth();
  if (!auth) return null;
  try {
    const res = await fetch(
      `${AIRCALL_BASE}/calls/search?phone_number=${encodeURIComponent(
        e164
      )}&order=desc&per_page=20`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { calls?: { id: number; started_at?: number }[] };
    const calls = (data.calls ?? []).sort(
      (a, b) => (b.started_at ?? 0) - (a.started_at ?? 0)
    );
    for (const c of calls.slice(0, 10)) {
      const tr = await fetch(`${AIRCALL_BASE}/calls/${c.id}/transcription`, {
        headers: { Authorization: auth },
        cache: "no-store",
      });
      if (tr.ok) {
        const t = aircallTranscript(await tr.json());
        if (t) return t;
      }
    }
  } catch {
    /* no transcript */
  }
  return null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const number = params.get("number");
  if (!number) return Response.json({ error: "Missing ?number." }, { status: 400 });
  const e164 = toE164(number);
  // the Togal-side number (from/to) lets us target the right Quo line directly
  const internal = params.get("internal");

  const quo = await tryQuo(e164, internal);
  if (quo) return Response.json({ source: "quo", transcript: quo });

  const aircall = await tryAircall(e164);
  if (aircall) return Response.json({ source: "aircall", transcript: aircall });

  return Response.json({ source: null, transcript: null });
}

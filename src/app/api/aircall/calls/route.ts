// Lists the most recent Aircall calls. Auth (api_id:api_token) is server-side only.
import { AIRCALL_BASE, aircallAuth } from "@/lib/aircall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawAircallCall {
  id: number;
  direction?: string;
  status?: string;
  started_at?: number;
  duration?: number;
  raw_digits?: string;
  recording?: string | null;
  missed_call_reason?: string | null;
  contact?: { first_name?: string; last_name?: string } | null;
}

export async function GET() {
  const auth = aircallAuth();
  if (!auth) {
    return Response.json(
      {
        error:
          "Aircall isn't connected: set AIRCALL_API_ID and AIRCALL_API_KEY in .env.local (local) or the Railway service variables (prod).",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${AIRCALL_BASE}/calls?per_page=20&order=desc`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 180);
      return Response.json(
        { error: `Aircall API error (${res.status}). ${detail}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { calls?: RawAircallCall[] };
    const calls = (data.calls ?? []).map((c) => ({
      id: c.id,
      direction: c.direction ?? null,
      number: c.raw_digits ?? null,
      contactName: c.contact
        ? [c.contact.first_name, c.contact.last_name].filter(Boolean).join(" ") || null
        : null,
      startedAt: c.started_at ? new Date(c.started_at * 1000).toISOString() : null,
      durationSec: typeof c.duration === "number" ? c.duration : null,
      status: c.status ?? null,
      missed: !!c.missed_call_reason,
      hasRecording: !!c.recording,
    }));
    return Response.json({ calls });
  } catch {
    return Response.json({ error: "Couldn't reach Aircall." }, { status: 502 });
  }
}

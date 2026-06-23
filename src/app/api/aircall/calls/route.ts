// Lists the most recent Aircall calls, each enriched with its HubSpot contact.
// All auth (Aircall Basic + HubSpot token) is server-side only.
import { AIRCALL_BASE, aircallAuth } from "@/lib/aircall";
import { hubspotContactByPhone } from "@/lib/hubspot";

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
      hubspot: null as Awaited<ReturnType<typeof hubspotContactByPhone>>,
    }));

    // enrich each call with its HubSpot contact (dedup numbers, best-effort)
    const numbers = [...new Set(calls.map((c) => c.number).filter(Boolean))] as string[];
    const lookups = await Promise.all(
      numbers.map(async (n) => [n, await hubspotContactByPhone(n)] as const)
    );
    const byNumber = new Map(lookups);
    for (const c of calls) {
      if (c.number && byNumber.get(c.number)) c.hubspot = byNumber.get(c.number)!;
    }

    return Response.json({ calls });
  } catch {
    return Response.json({ error: "Couldn't reach Aircall." }, { status: 502 });
  }
}

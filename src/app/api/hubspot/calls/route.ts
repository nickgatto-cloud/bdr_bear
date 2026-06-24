// Pulls the most recent call engagements from HubSpot — the unified call log —
// and enriches each with its contact. The phone numbers ride along as the bridge
// to the telephony provider (Aircall / Quo) for the actual recording/transcript.
// The access token is read SERVER-SIDE only (never sent to the browser/logged).
import { hubspotContactByPhone, type HubContact } from "@/lib/hubspot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HUBSPOT_SEARCH_URL = "https://api.hubapi.com/crm/v3/objects/calls/search";

interface RawCall {
  id: string;
  properties?: Record<string, string | null>;
}

/** HubSpot stores call notes as HTML — flatten to readable plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>(?!\n)/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return Response.json(
      {
        error:
          "HubSpot isn't connected: HUBSPOT_ACCESS_TOKEN isn't set on the server. Add it to .env.local for local dev, or to the Railway service variables in production.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(HUBSPOT_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        limit: 20,
        sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
        properties: [
          "hs_call_title",
          "hs_call_body",
          "hs_timestamp",
          "hs_call_duration",
          "hs_call_direction",
          "hs_call_status",
          "hs_call_from_number",
          "hs_call_to_number",
          "hs_call_recording_url",
        ],
      }),
    });

    if (!res.ok) {
      // surface HubSpot's status only; the token lives in the request, never the response
      const detail = (await res.text()).slice(0, 200);
      const message =
        res.status === 403
          ? "HubSpot 403: the private app is missing a required scope. Add 'crm.objects.calls.read' (CRM › Calls › Read) to the app in HubSpot → Settings → Integrations → Private Apps, then retry."
          : res.status === 401
          ? "HubSpot 401: the access token is invalid or expired. Check HUBSPOT_ACCESS_TOKEN."
          : `HubSpot API error (${res.status}). ${detail}`;
      return Response.json({ error: message }, { status: 502 });
    }

    const data = (await res.json()) as { results?: RawCall[] };
    const calls = (data.results ?? []).map((r) => {
      const p = r.properties ?? {};
      const direction = p.hs_call_direction ?? null;
      const from = p.hs_call_from_number ?? null;
      const to = p.hs_call_to_number ?? null;
      // the prospect's number is the caller on inbound, the callee on outbound;
      // the Togal-side number is the other one (used to target the Quo line)
      const externalNumber =
        direction === "INBOUND" ? from ?? to : to ?? from;
      const internalNumber =
        direction === "INBOUND" ? to ?? from : from ?? to;
      return {
        id: r.id,
        title: p.hs_call_title?.trim() || "Untitled call",
        timestamp: p.hs_timestamp ?? null,
        durationMs: p.hs_call_duration ? Number(p.hs_call_duration) : null,
        direction,
        status: p.hs_call_status ?? null,
        fromNumber: from,
        toNumber: to,
        externalNumber,
        internalNumber,
        recordingUrl: p.hs_call_recording_url ?? null,
        body: p.hs_call_body ? stripHtml(p.hs_call_body) : "",
        hubspot: null as HubContact | null,
      };
    });

    // enrich each call with its HubSpot contact (dedup numbers). Sequential, NOT
    // Promise.all — a burst of search calls trips HubSpot's rate limit and the
    // dropped requests come back as "no match".
    const numbers = [
      ...new Set(calls.map((c) => c.externalNumber).filter(Boolean)),
    ] as string[];
    const byNumber = new Map<string, HubContact | null>();
    for (const n of numbers) byNumber.set(n, await hubspotContactByPhone(n));
    for (const c of calls) {
      if (c.externalNumber && byNumber.get(c.externalNumber)) {
        c.hubspot = byNumber.get(c.externalNumber)!;
      }
    }

    return Response.json({ calls });
  } catch {
    return Response.json(
      { error: "Couldn't reach HubSpot. Check the connection and try again." },
      { status: 502 }
    );
  }
}

// Fetches a single Aircall call's transcription (requires Aircall AI). 404s
// gracefully to { transcript: null } for calls that don't have one.
import { AIRCALL_BASE, aircallAuth } from "@/lib/aircall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Utterance {
  text?: string;
  speaker_id?: string | number;
}

export async function GET(request: Request) {
  const auth = aircallAuth();
  if (!auth) {
    return Response.json(
      { error: "Aircall isn't connected (AIRCALL_API_ID / AIRCALL_API_KEY)." },
      { status: 503 }
    );
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing call id." }, { status: 400 });

  try {
    const res = await fetch(
      `${AIRCALL_BASE}/calls/${encodeURIComponent(id)}/transcription`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );
    if (res.status === 404) {
      return Response.json({
        transcript: null,
        reason: "No transcript for this call (requires Aircall AI / Conversation Intelligence).",
      });
    }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 180);
      return Response.json(
        { error: `Aircall API error (${res.status}). ${detail}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      transcription?: { content?: { utterances?: Utterance[] } | string };
    };
    const content = data.transcription?.content;
    let text = "";
    if (content && typeof content === "object" && Array.isArray(content.utterances)) {
      text = content.utterances
        .map((u) => (u.text ?? "").trim())
        .filter(Boolean)
        .join("\n");
    } else if (typeof content === "string") {
      text = content.trim();
    }
    return Response.json({ transcript: text || null });
  } catch {
    return Response.json({ error: "Couldn't reach Aircall." }, { status: 502 });
  }
}

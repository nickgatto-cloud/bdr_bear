import Anthropic from "@anthropic-ai/sdk";

// Turns a live-call transcript into HubSpot-ready call notes. The Anthropic key
// is read server-side only, never exposed to the client.
export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";

interface SummarizeBody {
  transcript?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Notes are off: ANTHROPIC_API_KEY isn't set on the server. Add it to .env.local for local dev, or to the Railway service variables in production.",
      },
      { status: 503 }
    );
  }

  let body: SummarizeBody;
  try {
    body = (await request.json()) as SummarizeBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  if (!transcript) {
    return Response.json(
      { error: "No live-call transcript yet — tag what you hear during the call first." },
      { status: 400 }
    );
  }

  const system = [
    "You turn a sales-call transcript into concise call notes a Togal.AI BDR can paste straight into a HubSpot call log.",
    "Output PLAIN TEXT only — short labeled lines, no markdown headers or asterisks.",
    "Base everything strictly on the transcript; never invent details. Omit any section you have nothing for.",
    "Use these sections in this order:",
    "Summary: 1–2 sentences on what happened.",
    "Contact / company: name(s) and company if stated.",
    "Current tools: any competitor or existing tool mentioned.",
    "Pains & objections: the key ones, as short dashes.",
    "Trade / sector: if mentioned.",
    "Sentiment: one word (warm / neutral / cold) + a short why.",
    "Next steps: concrete follow-ups or commitments.",
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: transcript }],
    });
    const notes = resp.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return Response.json({ notes });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status ?? "?"}): ${err.message}`
        : "Couldn't reach Claude. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}

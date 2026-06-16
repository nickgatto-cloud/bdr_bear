import Anthropic from "@anthropic-ai/sdk";
import { buildKnowledgeBase } from "@/lib/coaching";

// Server-only: the Anthropic key and the knowledge base live here, never the client.
export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";

interface AskBody {
  question?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Ask is off: ANTHROPIC_API_KEY isn't set on the server. Add it to .env.local for local dev, or to the Railway service variables in production.",
      },
      { status: 503 }
    );
  }

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }

  const system = [
    "You are a live sales-coaching assistant for Togal.AI reps. A rep is mid-call and needs a fast, usable answer.",
    "Answer the question using ONLY the Togal knowledge base below. Be concise and conversational — at most 2–5 sentences or a few short points the rep can say or act on right now.",
    "Never invent statistics, features, customers, or claims. If the knowledge base doesn't cover it, say so in one line and suggest what to ask the prospect or to book a demo.",
    "Lead with the answer; you can add one supporting proof point if relevant.",
    "",
    "=== TOGAL KNOWLEDGE BASE ===",
    buildKnowledgeBase(),
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: question }],
    });
    const answer = resp.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return Response.json({ answer });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status ?? "?"}): ${err.message}`
        : "Couldn't reach Claude. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}

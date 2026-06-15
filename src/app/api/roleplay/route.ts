import Anthropic from "@anthropic-ai/sdk";

// Run on the Node.js runtime — the Anthropic SDK and server-only env var live here.
export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";

interface RolePlayBody {
  prospectType?: string;
  objection?: string;
  difficulty?: string;
  persona?: string;
  opener?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

function buildSystemPrompt(b: RolePlayBody): string {
  return [
    `You are role-playing as a sales PROSPECT so a Togal.AI sales rep can practice a live discovery call.`,
    `Togal.AI is an AI construction takeoff tool — it auto-detects, measures, and compares construction drawings at up to 98% accuracy, and was built by estimators. Tagline: "Takeoff in minutes, not days."`,
    ``,
    `YOUR CHARACTER`,
    `- You are: ${b.prospectType ?? "a construction company decision-maker"}.`,
    `- Your stance / main objection: ${b.objection ?? "skeptical of new software"}.`,
    b.persona ? `- Persona & temperament: ${b.persona}` : "",
    b.opener ? `- You already opened the call by saying: "${b.opener}"` : "",
    ``,
    `HOW TO RESPOND`,
    `- Stay fully in character as this prospect. You ARE the prospect — not an assistant.`,
    `- Reply only with what the prospect would say out loud: 1–3 short, natural sentences. No narration, no stage directions, no quotation marks around your reply, no meta-commentary, no coaching.`,
    `- React realistically: reward genuine discovery questions and clear, specific value with curiosity; push back on vague claims, jargon, or pushy lines.`,
    `- Don't be a pushover and don't agree to a demo instantly — make the rep earn it. If they handle your objection well over a few exchanges, you can warm up and agree to a next step.`,
    `- Never break character, and never mention that this is a role-play or that you are an AI.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Live role-play is off: ANTHROPIC_API_KEY isn't set on the server. Add it to .env.local for local dev, or to the Railway service variables in production.",
      },
      { status: 503 }
    );
  }

  let body: RolePlayBody;
  try {
    body = (await request.json()) as RolePlayBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
  );
  if (messages.length === 0 || messages[0].role !== "user") {
    return Response.json(
      { error: "Conversation must start with the rep's message." },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: buildSystemPrompt(body),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = resp.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return Response.json({ reply });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status ?? "?"}): ${err.message}`
        : "Couldn't reach Claude. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}

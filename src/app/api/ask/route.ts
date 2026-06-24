import Anthropic from "@anthropic-ai/sdk";
import { buildKnowledgeBase } from "@/lib/coaching";
import { searchHubspotCompanies, COMPANY_TRADES } from "@/lib/hubspot";

// Server-only: the Anthropic key, the knowledge base, and the HubSpot token all
// live here, never the client.
export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";

interface AskBody {
  question?: string;
}

const COMPANY_TOOL: Anthropic.Tool = {
  name: "search_hubspot_companies",
  description:
    "Search Togal's HubSpot CRM for real customer/prospect companies filtered by US state and/or trade. " +
    "Use this whenever the rep asks which companies or customers Togal has (or could target) in a state " +
    "and/or a trade — e.g. 'flooring companies in Florida', 'who do we have in Texas', 'painting customers in CA', " +
    "'list our GCs in the northeast'. Returns matching company names with city and trade, plus the total count. " +
    "This CRM data is internal to Togal and fine to share with the rep.",
  input_schema: {
    type: "object",
    properties: {
      state_code: {
        type: "string",
        description:
          "2-letter US state code to filter by (e.g. FL, TX, CA). Convert any state name to its code. Omit if no state was given.",
      },
      trade: {
        type: "string",
        enum: COMPANY_TRADES as unknown as string[],
        description:
          "Trade category to filter by. Map the rep's wording to the closest value (e.g. 'GC' → 'General Contractor', 'painters' → 'Painting & Wallpaper'). Omit if no trade was given.",
      },
      limit: {
        type: "integer",
        description: "Max companies to return, 1–100. Default 25.",
      },
    },
  },
};

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
    "Answer using the Togal knowledge base below. Be concise and conversational — at most 2–5 sentences or a few short points the rep can say or act on right now.",
    "Never invent statistics, features, customers, or claims. If the knowledge base doesn't cover it, say so in one line and suggest what to ask the prospect or to book a demo.",
    "Lead with the answer; you can add one supporting proof point if relevant.",
    "",
    "You also have a tool, search_hubspot_companies, that looks up Togal's REAL customer/prospect companies from HubSpot by US state and/or trade. Use it whenever the rep asks who/which companies or customers are in a state or trade. When you report the results: open with the total count (e.g. 'Found 29 flooring companies in FL'), then list the returned companies ONE PER LINE as 'Company Name — City'. If more matched than were returned, say so. Don't fabricate companies — only list what the tool returns.",
    "",
    "=== TOGAL KNOWLEDGE BASE ===",
    buildKnowledgeBase(),
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: question },
    ];

    let answer = "";
    // agentic loop: let the model call the HubSpot tool, feed results back
    for (let turn = 0; turn < 4; turn++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 1200,
        system,
        tools: [COMPANY_TOOL],
        messages,
      });

      if (resp.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: resp.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of resp.content) {
          if (block.type === "tool_use" && block.name === "search_hubspot_companies") {
            const input = block.input as {
              state_code?: string;
              trade?: string;
              limit?: number;
            };
            const result = await searchHubspotCompanies({
              state: input.state_code,
              trade: input.trade,
              limit: input.limit,
            });
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      answer = resp.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("")
        .trim();
      break;
    }

    return Response.json({ answer });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status ?? "?"}): ${err.message}`
        : "Couldn't reach Claude. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}

# Togal Call Coach

A live sales-call coaching interface for **Togal.AI** — the AI-powered construction
takeoff tool. Built as a Next.js 16 (App Router) application, recreated from the
v7.1 design and wired up as a working interactive prototype.

> Takeoff in Minutes. Not Days.

## What it does

During a live call, the rep listens for objections, competitor mentions, trade
signals, and roles — then taps a chip (or types what the prospect said) to pull
the right **talk track** in real time.

- **Live transcript** — prospect utterances stream into the left panel.
- **Smart chip rail** — colour-coded by category (brand palette):
  - 🟠 **Competitors** (Bluebeam, STACK, PlanSwift/OST, Procore/Autodesk, Beam AI, Edge/Sage) → battlecards
  - ⚪ **Objections** (No budget, Don't trust AI, Too busy, …) → rebuttals
  - 🟢 **Trades** (Drywall, Concrete, Electrical, Painting, …) → demo-tailoring tips
  - 🔵 **Roles** (Owner, Estimator, PM/Precon, Bid volume) → who-you're-talking-to coaching
  - 🟣 **Claude/LLM** & **IT/Security** → tech and security handling
- **Free-text analyze** — type what the prospect said; the coach keyword-matches it
  to the right card and lights the matching chip.
- **FANT** (Fit · Authority · Need · Timing) and **VESTT** (Verify · Educate · Show ·
  Tailor · Trial-close) trackers light up automatically as coaching cards fire.
- **Action scripts** — Book demo, FANT+VESTT brief, Demo close, Battlecard, and
  Follow-up generate composed guidance from the current call context.

## Tech

- Next.js 16.2.9 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 with Togal brand tokens (Gaelic Green, Irish Orange, Denim Blue)
- Poppins (the Togal brand typeface)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production
```

### Environment / integrations

Every API key is read **server-side only** (never exposed to the browser). Set
them in `togal-call-coach/.env.local` for local dev, and in the **Railway service
→ Variables** tab for production — see `.env.example` for the full list.

| Variable | Powers | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude (`claude-opus-4-8`) — Analyze-bar Q&A + live Practice-scenario role-play | Practice scenario / Ask show a "set ANTHROPIC_API_KEY" message |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot CRM private-app token — Recent-calls feed, contact match, company intel | Recent-calls feed is empty |
| `QUO_API_KEY` | Quo (OpenPhone) — call transcripts for Quo-placed calls | Quo transcripts don't pull |
| `AIRCALL_API_ID` + `AIRCALL_API_KEY` | Aircall — call transcripts for Aircall-placed calls | Aircall transcripts don't pull |

HubSpot scopes required: `crm.objects.contacts.read`, `crm.objects.calls.read`,
`crm.objects.companies.read`.

```bash
# local
cp .env.example .env.local   # then fill in the values
```

**Railway (production):** add each variable above under the service's **Variables**
tab, then redeploy. A missing key degrades only its own feature (the route returns
a clear "isn't connected: set X" message) — the rest of the app keeps working.
**Transcripts not loading in production but working locally almost always means
`QUO_API_KEY` / `AIRCALL_API_ID` / `AIRCALL_API_KEY` aren't set in Railway**, since
`.env.local` is gitignored and never deployed. Never commit real values.

## Structure

| Path | Purpose |
|---|---|
| `src/app/page.tsx` | Renders the coach |
| `src/app/layout.tsx` | Poppins font + metadata |
| `src/app/globals.css` | Dark theme + brand tokens + component styles |
| `src/components/CallCoach.tsx` | The full interactive client component |
| `src/components/tabs/*` | Book demo, FANT qualify, Call script, Role plays, Dangerous software |
| `src/app/api/roleplay/route.ts` | Server route — Claude plays the prospect (Practice scenario) |
| `src/lib/coaching.ts` | Coaching knowledge base — chips, battlecards, frameworks, scripts |

## Notes

The coaching content is illustrative sales guidance. Per Togal policy, the
IT/Security card never improvises specifics — it routes security questions to the
security team rather than stating credentials or configuration details.

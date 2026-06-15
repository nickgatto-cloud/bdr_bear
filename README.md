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

### Live AI role-play (Practice scenario)

The **Role plays → Practice scenario** tab can run a live back-and-forth where
Claude plays the prospect. This requires an Anthropic API key, read server-side
only (never exposed to the browser):

- **Local:** create `togal-call-coach/.env.local` with:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- **Railway (production):** add `ANTHROPIC_API_KEY` to the service's Variables.

Without the key, the rest of the app works fully; the Practice scenario shows a
clear "set ANTHROPIC_API_KEY" message instead of live replies. The role-play
uses `claude-opus-4-8` via the official `@anthropic-ai/sdk`.

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

// Togal Call Coach — coaching knowledge base
// Powers the live objection-handling, battlecards, and FANT/VESTT qualification.

export type FantKey = "F" | "A" | "N" | "T";
export type VesttKey = "V" | "E" | "S" | "T1" | "T2";

export type ChipCategory =
  | "competitor"
  | "objection"
  | "tech"
  | "security"
  | "trade"
  | "role";

export interface Chip {
  id: string;
  label: string;
  category: ChipCategory;
}

export interface CoachingCard {
  /** matches a chip id */
  id: string;
  /** short label shown in the guidance card header */
  tag: string;
  category: ChipCategory;
  heading: string;
  /** what the prospect probably means */
  signal: string;
  /** the recommended talk track / rebuttal */
  talkTrack: string;
  /** one-line tactical tip */
  tip?: string;
  /** qualification dimensions this move advances */
  fant?: FantKey[];
  vestt?: VesttKey[];
  /** keywords that map free-text input to this card */
  keywords: string[];
}

/* ------------------------------------------------------------------ */
/*  Frameworks                                                         */
/* ------------------------------------------------------------------ */

export const FANT: { key: FantKey; label: string; full: string; hint: string }[] = [
  { key: "F", label: "F — Fit", full: "Fit", hint: "Right trade, plan volume, and workflow for Togal." },
  { key: "A", label: "A — Auth", full: "Authority", hint: "Talking to (or routed toward) the decision-maker." },
  { key: "N", label: "N — Need", full: "Need", hint: "A real takeoff pain that costs them time or bids." },
  { key: "T", label: "T — Time", full: "Timing", hint: "A reason to act now — active bids, season, deadline." },
];

export const VESTT: { key: VesttKey; label: string; full: string; hint: string }[] = [
  { key: "V", label: "V", full: "Value", hint: "Lead with the outcome — time saved, bids won." },
  { key: "E", label: "E", full: "Expert", hint: "Earn credibility — built by estimators, up to 98% accuracy." },
  { key: "S", label: "S", full: "Structure", hint: "Run the call on a clear, deliberate path." },
  { key: "T1", label: "T", full: "Triggers", hint: "Surface the compelling event creating urgency." },
  { key: "T2", label: "T", full: "Tone", hint: "Read the room — consultative, match their energy." },
];

/* ------------------------------------------------------------------ */
/*  Chips (rendered in screenshot order)                               */
/* ------------------------------------------------------------------ */

export const CHIPS: Chip[] = [
  { id: "beam-ai", label: "Beam AI", category: "competitor" },
  { id: "bluebeam", label: "Bluebeam", category: "competitor" },
  { id: "planswift", label: "PlanSwift", category: "competitor" },
  { id: "ost", label: "On-Screen (OST)", category: "competitor" },
  { id: "procore", label: "Procore/Autodesk", category: "competitor" },
  { id: "stack", label: "STACK", category: "competitor" },
  { id: "kreo", label: "Kreo", category: "competitor" },
  { id: "edge-sage", label: "Edge/Sage", category: "competitor" },
  { id: "manual", label: "Manual", category: "competitor" },
  { id: "claude-llm", label: "Claude/LLM", category: "competitor" },

  { id: "no-budget", label: "No budget", category: "objection" },
  { id: "dont-trust-ai", label: "Don't trust AI", category: "objection" },
  { id: "too-busy", label: "Too busy", category: "objection" },
  { id: "just-info", label: "Just send info", category: "objection" },
  { id: "tried-ai", label: "Tried AI before", category: "objection" },
  { id: "have-estimators", label: "Have estimators", category: "objection" },
  { id: "too-complex", label: "Too complex", category: "objection" },
  { id: "need-think", label: "Need to think", category: "objection" },

  { id: "it-security", label: "IT / Security", category: "security" },

  { id: "drywall", label: "Drywall/Framing", category: "trade" },
  { id: "flooring", label: "Flooring", category: "trade" },
  { id: "concrete", label: "Concrete", category: "trade" },
  { id: "electrical", label: "Electrical", category: "trade" },
  { id: "gc", label: "General Contractor", category: "trade" },
  { id: "painting", label: "Painting/Wallpaper", category: "trade" },

  { id: "owner", label: "Owner role", category: "role" },
  { id: "estimator", label: "Estimator role", category: "role" },
  { id: "pm-precon", label: "PM/Precon role", category: "role" },
  { id: "bid-volume", label: "Bid volume", category: "role" },
];

/* ------------------------------------------------------------------ */
/*  Competitor comparisons — Togal vs X feature matrices               */
/*  (sourced from Togal's official "VS" one-pagers)                    */
/* ------------------------------------------------------------------ */

export interface ComparisonRow {
  feature: string;
  togal: boolean;
  them: boolean;
}
export interface Comparison {
  them: string; // short competitor label for the column header
  proof?: string;
  rows: ComparisonRow[];
}

export const COMPARISONS: Record<string, Comparison> = {
  bluebeam: {
    them: "Bluebeam",
    proof: "NC Painting went 19 → 60 bids/month with the same team.",
    rows: [
      { feature: "AI auto-detect & count", togal: true, them: false },
      { feature: "AI image search", togal: true, them: false },
      { feature: "Togal GPT", togal: true, them: false },
      { feature: "Cloud-based", togal: true, them: false },
      { feature: "Arc-area, split & merge tools", togal: true, them: false },
      { feature: "AI included in one fee", togal: true, them: false },
      { feature: "PDF markup / RFIs / submittals", togal: false, them: true },
    ],
  },
  planswift: {
    them: "PlanSwift",
    proof: "A former PlanSwift customer tripled monthly bids after switching.",
    rows: [
      { feature: "AI auto-tracing", togal: true, them: false },
      { feature: "Cloud-based", togal: true, them: false },
      { feature: "Uncapped real-time collaboration", togal: true, them: false },
      { feature: "Continuous updates & support", togal: true, them: false },
      { feature: "10–20× faster on floor plans", togal: true, them: false },
      { feature: "QuickBooks export", togal: false, them: true },
    ],
  },
  ost: {
    them: "OST",
    proof: "KU study: ~70% faster, ~5% accuracy gap; Clark moved 170 estimators.",
    rows: [
      { feature: "AI as core product (not beta)", togal: true, them: false },
      { feature: "Arc & circle cuts", togal: true, them: false },
      { feature: "Advanced geometry tools", togal: true, them: false },
      { feature: "Custom formulas", togal: true, them: false },
      { feature: "All features in one fee", togal: true, them: false },
      { feature: "Real-time cloud collaboration", togal: true, them: false },
      { feature: "30+ years in market", togal: false, them: true },
    ],
  },
  stack: {
    them: "STACK",
    proof: "With STACK you drop to view-only — data locked — if you don't renew.",
    rows: [
      { feature: "Purpose-built AI takeoff focus", togal: true, them: false },
      { feature: "Simple UI / fast start", togal: true, them: false },
      { feature: "Frequent product updates", togal: true, them: false },
      { feature: "Keep data access if you lapse", togal: true, them: false },
      { feature: "All-in-one precon (bid/project mgmt)", togal: false, them: true },
    ],
  },
  "beam-ai": {
    them: "Beam",
    proof: "Beam is offshore done-for-you; Togal is software you run and own.",
    rows: [
      { feature: "You run it yourself (software)", togal: true, them: false },
      { feature: "You keep control of your data", togal: true, them: false },
      { feature: "Instant, self-serve turnaround", togal: true, them: false },
      { feature: "Flat fee (no per-sheet charges)", togal: true, them: false },
      { feature: "iPad support", togal: true, them: false },
      { feature: "Done-for-you takeoff service", togal: false, them: true },
    ],
  },
  kreo: {
    them: "Kreo",
    proof: "Kreo is foreign-owned with no manual fallback when the AI stalls.",
    rows: [
      { feature: "Manual fallback when AI gets stuck", togal: true, them: false },
      { feature: "US-owned (Florida-based)", togal: true, them: false },
      { feature: "All features in one fee", togal: true, them: false },
      { feature: "Unlimited viewer-only accounts", togal: true, them: false },
      { feature: "CAD / DWG / DXF import", togal: false, them: true },
    ],
  },
  procore: {
    them: "Procore",
    proof: "Different jobs — Procore runs the project, Togal does the takeoff.",
    rows: [
      { feature: "AI takeoff & quantity extraction", togal: true, them: false },
      { feature: "Feeds quantities into your workflow", togal: true, them: false },
      { feature: "Project & document management", togal: false, them: true },
      { feature: "Construction-management platform", togal: false, them: true },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Coaching cards                                                     */
/* ------------------------------------------------------------------ */

export const COACHING: Record<string, CoachingCard> = {
  /* ---- Competitor battlecards ---- */
  "beam-ai": {
    id: "beam-ai",
    tag: "Battlecard",
    category: "competitor",
    heading: "Beam AI",
    signal: "They're weighing Beam — a done-for-you, offshore takeoff service, not software they run.",
    talkTrack:
      "Beam is a done-for-you service: you send sheets, an offshore team does the takeoff with about a 72-hour turnaround, and you pay tiered fees per sheet — so your drawings leave your hands and the cost scales with volume. Togal is user-owned: your estimators run it themselves (even on iPad), you keep control of your data, and one subscription covers it with no per-sheet meter. Built by estimators, up to 98% accuracy, with side-by-side revision comparison. If data control or turnaround matters, that's the wedge — offer to run one of their plans live.",
    tip: "Beam = offshore done-for-you. Win on data control, instant turnaround, and flat pricing.",
    fant: ["N"],
    vestt: ["E", "S"],
    keywords: ["beam ai", "beam.ai", "beam"],
  },
  bluebeam: {
    id: "bluebeam",
    tag: "Battlecard",
    category: "competitor",
    heading: "Bluebeam",
    signal: "Bluebeam is their markup + collaboration hub — they think they're covered for takeoff.",
    talkTrack:
      "Bluebeam is excellent for markup, RFIs, and submittals — keep it for that. But at heart it's a PDF editor: takeoff is still by hand, AI is a paid add-on, and collaboration and bulk processing are capped by tier. Togal is purpose-built for takeoff — it auto-detects and counts in minutes, color-codes every classification so it's easy to see, and exports come out organized and grouped. Proof: NC Painting went from 19 bids a month on Bluebeam to 60 with the same team.",
    tip: "Complementary, not either/or — Togal measures, Bluebeam marks up. Lead with the NC Painting 19→60 bids proof.",
    fant: ["F", "N"],
    vestt: ["V", "E"],
    keywords: ["bluebeam", "blue beam"],
  },
  planswift: {
    id: "planswift",
    tag: "Battlecard",
    category: "competitor",
    heading: "PlanSwift",
    signal: "They run a legacy desktop tool — 100% manual, click-by-click takeoff.",
    talkTrack:
      "PlanSwift is desktop-based and fully manual — every count and area is a click, and the perpetual license only includes support and updates in the first year. Togal is cloud-based with AI auto-tracing that's 10–20× faster on floor plans, uncapped real-time collaboration, and continuous updates. A former PlanSwift customer tripled their monthly bids after switching. Ask how long a plan set takes them today, then run it live in Togal.",
    tip: "Quantify their click-time, then beat it live — and drop the 3× bids proof point.",
    fant: ["N", "T"],
    vestt: ["V", "S"],
    keywords: ["planswift", "plan swift"],
  },
  ost: {
    id: "ost",
    tag: "Battlecard",
    category: "competitor",
    heading: "On-Screen Takeoff (OST)",
    signal: "They run On-Screen Takeoff — legacy click-by-click manual measuring.",
    talkTrack:
      "OST has been the workhorse for 30 years, but it's manual, expanded features cost extra, and its AI is still in beta behind a separate subscription. Togal's AI is the core product and improving constantly — plus arc and circle cuts, advanced geometry, custom formulas, and richer quantity outputs OST doesn't have. Proof: an independent University of Kansas study found Togal 76% faster than OST, and Clark Construction moved 170 estimators across. Ask their per-plan time in OST, then run it live.",
    tip: "Lead with the KU study (76% faster) and Clark Construction's 170-estimator switch.",
    fant: ["N", "T"],
    vestt: ["V", "S"],
    keywords: ["ost", "on-screen", "on screen", "on-screen takeoff", "onscreen"],
  },
  procore: {
    id: "procore",
    tag: "Battlecard",
    category: "competitor",
    heading: "Procore / Autodesk",
    signal: "They're citing a project/construction-management platform.",
    talkTrack:
      "Procore and Autodesk run the project — they don't do AI takeoff. Togal lives upstream at the estimating stage and feeds quantities into your process. It's not an either/or. Keep the platform; add the takeoff engine that fills it.",
    tip: "Reframe: platform vs. takeoff engine — different jobs.",
    fant: ["F"],
    vestt: ["E"],
    keywords: ["procore", "autodesk", "construction cloud", "assemble"],
  },
  stack: {
    id: "stack",
    tag: "Battlecard",
    category: "competitor",
    heading: "STACK",
    signal: "All-in-one precon suite — but takeoff is still manual, and data locks if they stop paying.",
    talkTrack:
      "STACK is an all-in-one precon suite — estimating, bid and project management — so it carries a bigger learning curve and gets spread thin (no major updates in the last 6 months). Togal is laser-focused on AI takeoff: a simpler UI, faster shipping, and auto-detection so estimators verify instead of trace. One thing worth flagging: STACK drops you to view-only if your subscription lapses, so your data's effectively locked. Offer a head-to-head on one of their real plans.",
    tip: "Focused AI takeoff vs. a spread-thin suite — and raise the 'lose access to your data if you don't renew' risk.",
    fant: ["N"],
    vestt: ["E", "S"],
    keywords: ["stack"],
  },
  kreo: {
    id: "kreo",
    tag: "Battlecard",
    category: "competitor",
    heading: "Kreo",
    signal: "Another AI takeoff/estimating tool — it pitches full automation but stalls on messy drawings.",
    talkTrack:
      "Kreo and Togal both do AI takeoff, so make it about what happens when the automation hits a real, messy plan. Kreo goes all-in on automation with no manual fallback when it gets stuck — Togal pairs AI with advanced manual tools as a backup, so you're never blocked. Togal is US-owned and Florida-based with one subscription for every feature; Kreo is foreign-owned and charges add-ons for reports, collaboration, and annotation. If data ownership matters, that's worth weighing. Run one of your tougher plan sets and see how each handles it.",
    tip: "Win on the hybrid fallback (never stuck), US ownership / data control, and all-in-one pricing.",
    fant: ["N"],
    vestt: ["E", "S"],
    keywords: ["kreo"],
  },
  "edge-sage": {
    id: "edge-sage",
    tag: "Battlecard",
    category: "competitor",
    heading: "The EDGE / Sage Estimating",
    signal: "They have a downstream estimating/costing system.",
    talkTrack:
      "The EDGE and Sage are where pricing lives — keep them. Togal handles the quantity takeoff that feeds those systems faster and more accurately. The hand-off is the value: get clean quantities into your estimating tool in minutes, not days.",
    tip: "Togal feeds their estimating system — it doesn't compete with it.",
    fant: ["F"],
    vestt: ["E"],
    keywords: ["edge", "the edge", "sage", "estimating edge"],
  },
  manual: {
    id: "manual",
    tag: "Battlecard",
    category: "competitor",
    heading: "Manual takeoff (by hand)",
    signal: "They still measure by hand — paper plans, a scale ruler, or clicking PDFs manually. Slow and error-prone.",
    talkTrack:
      "Manual is the most expensive way to take off — it's slow, it's where errors creep in, and it caps how many bids you can chase. Togal auto-detects and measures in minutes at up to 98% accuracy, and you verify. Going from hand-measuring to AI is the single biggest time win we see. Let me run one of your live plan sets so you can watch it.",
    tip: "Manual = the clearest ROI story. Get hours-per-takeoff today, then show minutes.",
    fant: ["N", "T"],
    vestt: ["V", "S"],
    keywords: ["manual", "by hand", "pen and paper", "scale ruler", "count by hand", "measure by hand"],
  },

  /* ---- Objections ---- */
  "no-budget": {
    id: "no-budget",
    tag: "Objection",
    category: "objection",
    heading: "\"No budget\"",
    signal: "Often means 'I don't see the ROI yet,' not 'I have zero dollars.'",
    talkTrack:
      "Anchor to the return, not the price. 'What's a won bid worth to you?' If Togal cuts takeoff time so you bid even one or two more jobs a month, it pays for itself many times over. Let's put real numbers on it — how many bids do you walk away from for lack of time?",
    tip: "Convert price to ROI: time saved × bids won.",
    fant: ["A", "N"],
    vestt: ["V", "T2"],
    keywords: ["no budget", "too expensive", "cost too much", "can't afford", "price", "expensive"],
  },
  "dont-trust-ai": {
    id: "dont-trust-ai",
    tag: "Objection",
    category: "objection",
    heading: "\"Don't trust AI\"",
    signal: "They fear losing control or accuracy on numbers they're accountable for.",
    talkTrack:
      "Smart — you should be skeptical, your name's on the bid. Togal is a co-pilot, not autopilot: the AI does the first-pass detection and measuring, then you verify and adjust any region. And it's independently validated — a University of Kansas study clocked ~70% average time savings (up to ~76% on a plan set) at accuracy within ~5% of OST, and concluded AI works best paired with the estimator's judgment, not replacing it. You stay in control of every number — let me show you correcting a region live.",
    tip: "Reframe AI as a verifiable co-pilot, backed by the independent KU study (~5% accuracy gap, ~70% faster).",
    fant: ["N"],
    vestt: ["E", "S"],
    keywords: ["trust ai", "don't trust", "dont trust", "accuracy", "accurate", "black box", "wrong"],
  },
  "too-busy": {
    id: "too-busy",
    tag: "Objection",
    category: "objection",
    heading: "\"Too busy\"",
    signal: "Being slammed with takeoffs is the exact problem Togal solves.",
    talkTrack:
      "That's the reason to look, not the reason to wait — busy means takeoffs are eating your week. Give me 15 minutes with one of your live plan sets and I'll run the takeoff while you watch. If it doesn't save you hours, we stop there.",
    tip: "Turn 'busy' into urgency. Ask for 15 minutes on a live plan.",
    fant: ["T"],
    vestt: ["V", "T2"],
    keywords: ["too busy", "no time", "slammed", "swamped", "busy"],
  },
  "just-info": {
    id: "just-info",
    tag: "Objection",
    category: "objection",
    heading: "\"Just send info\"",
    signal: "A polite brush-off — a PDF rarely creates a decision.",
    talkTrack:
      "Happy to send it — but the 'aha' only lands when you see it on your own drawings. A 15-minute screen share beats any deck. I'll send a one-pager and we grab 15 minutes Thursday so it's not just another email in your inbox. What works?",
    tip: "Trade the info for a short, dated demo slot.",
    fant: ["A", "T"],
    vestt: ["T2"],
    keywords: ["send info", "send information", "send me", "email me", "send something", "send over"],
  },
  "tried-ai": {
    id: "tried-ai",
    tag: "Objection",
    category: "objection",
    heading: "\"Tried AI before\"",
    signal: "They were burned by 'AI' that was a buzzword on a manual tool.",
    talkTrack:
      "What did you try, and where did it fall down? A lot of 'AI takeoff' is automation with an AI sticker — pull the label off and nothing changes. Togal is real computer vision, built by estimators and purpose-trained on construction drawings, and it's been independently studied: a University of Kansas paper found ~70% time savings at accuracy within ~5% of OST. The real test is a messy, live plan — let me run the one that tripped up the last tool.",
    tip: "Diagnose the prior failure, separate real AI from AI-washing, then prove it on a messy plan.",
    fant: ["N"],
    vestt: ["V", "E", "S"],
    keywords: ["tried ai", "tried it before", "didn't work", "didnt work", "used ai", "already tried"],
  },
  "have-estimators": {
    id: "have-estimators",
    tag: "Objection",
    category: "objection",
    heading: "\"We have estimators\"",
    signal: "Fear that Togal replaces people, or that they're already covered.",
    talkTrack:
      "Perfect — Togal makes them faster, it doesn't replace them. Your estimators stop tracing and spend their time on strategy, scope, and review — which is exactly what the independent University of Kansas study concluded: AI works best paired with the estimator's judgment, not instead of it. Same team, more bids out the door, fewer late nights. Want one of them to run a takeoff in the demo?",
    tip: "Position as a force-multiplier for the estimators you already have.",
    fant: ["F", "N"],
    vestt: ["E", "T1"],
    keywords: ["have estimators", "got estimators", "our estimators", "team does", "we do it in house"],
  },
  "too-complex": {
    id: "too-complex",
    tag: "Objection",
    category: "objection",
    heading: "\"Too complex\"",
    signal: "They expect a steep learning curve or CAD skills.",
    talkTrack:
      "It's simpler than what you do today. Drop a plan, click detect, verify — most estimators run their first real takeoff inside the demo, no CAD skills needed. The whole point is fewer clicks, faster takeoffs. Let me prove it on one of your plans right now.",
    tip: "Counter 'complex' with a live first-takeoff in the demo.",
    fant: ["F"],
    vestt: ["E", "S"],
    keywords: ["too complex", "complicated", "hard to use", "learning curve", "difficult", "complex"],
  },
  "need-think": {
    id: "need-think",
    tag: "Objection",
    category: "objection",
    heading: "\"Need to think about it\"",
    signal: "Usually a missing piece — info, a stakeholder, or confidence.",
    talkTrack:
      "Totally fair. So I bring the right thing back — what specifically do you want to think through: the numbers, the fit for your trade, or who else needs to weigh in? Let's get those people on a 20-minute demo so you're deciding with full information instead of a maybe.",
    tip: "Surface the real blocker; convert the stall into a scheduled step.",
    fant: ["A", "T"],
    vestt: ["V", "T2"],
    keywords: ["think about it", "need to think", "internally", "discuss internally", "get back to you", "circle back"],
  },

  /* ---- General LLM (competitor) ---- */
  "claude-llm": {
    id: "claude-llm",
    tag: "Battlecard",
    category: "competitor",
    heading: "Claude / general LLM",
    signal: "They're leaning on a general AI chatbot (ChatGPT, Claude, Copilot) and assume it can do the takeoff.",
    talkTrack:
      "A general LLM is great for summarizing and Q&A — but it guesses, and it'll confidently hand you quantities that aren't on the page. It isn't built to measure a drawing. Togal's detection is purpose-built computer-vision trained on real construction plans, up to 98% accuracy, and you verify every region. Use the chatbot for questions; use Togal for the numbers you're putting on a bid.",
    tip: "Don't bash the LLM — show where it breaks (measuring) vs. where Togal is built to win.",
    fant: ["N"],
    vestt: ["E"],
    keywords: ["claude", "chatgpt", "llm", "gpt", "language model", "just ai", "is it ai", "copilot"],
  },

  /* ---- Security ---- */
  "it-security": {
    id: "it-security",
    tag: "Security",
    category: "security",
    heading: "IT / Security review",
    signal: "There's a security or data-handling gate before they can buy.",
    talkTrack:
      "Great question to raise early. Your drawings are encrypted in transit and at rest, and we can share our security documentation and SOC 2 details on request. I won't guess at specifics on the call — let me connect you with our security team so your IT folks get the right answers directly.",
    tip: "Acknowledge, don't improvise specifics. Route to the security team.",
    fant: ["A", "T"],
    vestt: ["E", "T2"],
    keywords: ["security", "it review", "data", "encrypt", "soc 2", "soc2", "compliance", "privacy", "infosec"],
  },

  /* ---- Trades (tailor the demo) ---- */
  drywall: {
    id: "drywall",
    tag: "Trade fit",
    category: "trade",
    heading: "Drywall / Framing",
    signal: "Wall-heavy work — linear footage and sheet counts dominate.",
    talkTrack:
      "Perfect trade for Togal. It auto-detects wall lengths and areas, so you get linear footage and board/sheet counts in minutes. In the demo, pull up a floor plan and show walls detected and totaled — that's their daily grind, gone.",
    tip: "Demo wall auto-detect + linear footage on a floor plan.",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["drywall", "framing", "dry wall", "studs", "partition"],
  },
  flooring: {
    id: "flooring",
    tag: "Trade fit",
    category: "trade",
    heading: "Flooring",
    signal: "Area-driven: square footage per room and per floor type prices the job.",
    talkTrack:
      "Flooring is pure area takeoff — Togal auto-detects every room boundary and gives you square footage in seconds, broken out by room so you can price carpet, LVT, tile, and hardwood separately, and the closets and transitions that usually get missed get counted. Proof: Total Flooring took off a 30-story high-rise in 48 hours — normally about two weeks of clicking — won the bid, and even caught an expensive plan error the GC had missed.",
    tip: "Demo room-by-room area auto-detection; drop the Total Flooring proof — 30-story high-rise in 48 hours.",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["flooring", "floor", "carpet", "tile", "vinyl", "lvt", "hardwood", "square footage"],
  },
  concrete: {
    id: "concrete",
    tag: "Trade fit",
    category: "trade",
    heading: "Concrete",
    signal: "Areas and volumes — slabs, footings, foundations.",
    talkTrack:
      "Lead with area + volume: Togal auto-detects slab areas and you carry depth to volume in seconds. Show a slab plan detected and totaled — concrete estimators feel the time savings immediately on big pours.",
    tip: "Demo slab area auto-detect, then volume.",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["concrete", "slab", "footing", "foundation", "rebar", "pour"],
  },
  electrical: {
    id: "electrical",
    tag: "Trade fit",
    category: "trade",
    heading: "Electrical",
    signal: "Counts dominate — fixtures, devices, plus home-run lengths.",
    talkTrack:
      "Counting is where Togal shines for electrical: auto-count fixtures and devices across the plan set instead of tallying by hand, then add home-run lengths. Show a lighting plan with symbols counted automatically — that's hours back per bid.",
    tip: "Demo symbol/device counting on a lighting or power plan.",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["electrical", "fixtures", "devices", "lighting", "conduit", "panel"],
  },
  gc: {
    id: "gc",
    tag: "Trade fit",
    category: "trade",
    heading: "General Contractor",
    signal: "Multi-trade scope — breadth and revision churn are the pain.",
    talkTrack:
      "GCs feel two pains: scoping a whole plan set fast, and keeping revisions aligned across a distributed team. Togal scopes multiple trades quickly, compares revisions side-by-side so nothing slips between addenda, and lets estimators work the same project in real time. Proof: Coastal Construction cut preconstruction effort 50–65% — 140–230 hours saved per project — and Consigli runs 80–100 estimators on Togal after 25 years on On-Screen Takeoff.",
    tip: "Lead with Coastal (50–65% faster, 140–230 hrs/project) and Consigli (80–100 estimators, switched off OST).",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["general contractor", "gc", "self perform", "multi trade", "multi-trade"],
  },
  painting: {
    id: "painting",
    tag: "Trade fit",
    category: "trade",
    heading: "Painting / Wallpaper",
    signal: "Wall and ceiling areas, broken out by room.",
    talkTrack:
      "Painters bid by paintable area — Togal pulls wall and ceiling square footage per room so you're not measuring every space by hand, and its 3D view helps the field see exactly which walls to paint, cutting rework. Proof: Illusions Painting went from two-week takeoffs to getting them done 'in the blink of an eye,' with the whole team collaborating on the same takeoff in real time.",
    tip: "Demo wall/ceiling area by room + the 3D view; proof: Illusions went from two-week takeoffs to hours.",
    fant: ["F", "N"],
    vestt: ["S", "T1"],
    keywords: ["painting", "paint", "wallpaper", "coatings", "wall covering"],
  },

  /* ---- Roles ---- */
  owner: {
    id: "owner",
    tag: "Role",
    category: "role",
    heading: "Owner / Principal",
    signal: "Decision-maker — speaks ROI, growth, and win rate.",
    talkTrack:
      "Talk business outcomes, not features: more bids out the door, higher win rate, less overtime and burnout on the estimating team. Owners buy growth. Quantify it — 'bid X% more jobs without adding headcount' — and they lean in.",
    tip: "Sell growth + win rate. This is your Authority signal.",
    fant: ["A"],
    vestt: ["V", "T2"],
    keywords: ["owner", "principal", "founder", "president", "ceo"],
  },
  estimator: {
    id: "estimator",
    tag: "Role",
    category: "role",
    heading: "Estimator",
    signal: "The end user — cares about time, ease, and accuracy.",
    talkTrack:
      "Speak to their day: less tracing, fewer late nights, numbers they can trust. Let them drive in the demo — when an estimator runs their own takeoff and sees it land, you've got a champion who'll sell internally for you.",
    tip: "Make them the hero — hands on keyboard in the demo.",
    fant: ["N"],
    vestt: ["S", "T1"],
    keywords: ["estimator", "takeoff person", "i do the takeoffs", "i estimate"],
  },
  "pm-precon": {
    id: "pm-precon",
    tag: "Role",
    category: "role",
    heading: "PM / Preconstruction",
    signal: "Owns speed-to-bid and coordination across revisions.",
    talkTrack:
      "Lead with speed-to-bid and revision control: Togal compresses takeoff turnaround and compares drawing revisions so scope changes don't slip. Precon lives and dies by deadlines — frame Togal as the way to hit more of them with the same team.",
    tip: "Sell turnaround time + revision comparison.",
    fant: ["F", "N"],
    vestt: ["E", "T1"],
    keywords: ["pm", "project manager", "precon", "preconstruction", "estimating manager"],
  },
  "bid-volume": {
    id: "bid-volume",
    tag: "Discovery",
    category: "role",
    heading: "Bid volume",
    signal: "Sizing the value — volume turns time saved into dollars.",
    talkTrack:
      "Get the numbers: 'How many bids a month? What's your win rate? How many do you skip for lack of time?' Volume is the multiplier — every hour Togal saves per takeoff scales across every bid. This is your discovery anchor for the whole ROI case.",
    tip: "Ask bids/month + win rate. Volume drives the ROI math.",
    fant: ["N", "A"],
    vestt: ["V"],
    keywords: ["bid volume", "how many bids", "bids a month", "win rate", "volume"],
  },
};

/* ------------------------------------------------------------------ */
/*  Seed transcript (matches the screenshot)                           */
/* ------------------------------------------------------------------ */

export const SEED_TRANSCRIPT: string[] = [
  "We use Bluebeam in every workflow.",
  "We need to think about it internally.",
  "We do painting and wallpaper.",
  "Can you just send me some information?",
];

/* ------------------------------------------------------------------ */
/*  Free-text matching                                                 */
/* ------------------------------------------------------------------ */

/** Find the coaching card whose keywords best match a free-text utterance. */
export function matchUtterance(text: string): CoachingCard | null {
  const t = text.toLowerCase();
  let best: { card: CoachingCard; score: number } | null = null;
  for (const card of Object.values(COACHING)) {
    for (const kw of card.keywords) {
      if (t.includes(kw)) {
        const score = kw.length; // prefer the longest / most specific match
        if (!best || score > best.score) best = { card, score };
      }
    }
  }
  return best ? best.card : null;
}

/* ------------------------------------------------------------------ */
/*  Composed action scripts                                            */
/* ------------------------------------------------------------------ */

export interface ActionContext {
  competitor?: CoachingCard;
  trade?: CoachingCard;
  role?: CoachingCard;
  fant: Record<FantKey, boolean>;
  vestt: Record<VesttKey, boolean>;
}

export interface GuidanceBlock {
  tag: string;
  heading: string;
  body: string[];
}

const fantMissing = (fant: Record<FantKey, boolean>) =>
  FANT.filter((f) => !fant[f.key]).map((f) => f.full);

const vesttMissing = (vestt: Record<VesttKey, boolean>) =>
  VESTT.filter((v) => !vestt[v.key]).map((v) => v.full);

export function buildAction(action: string, ctx: ActionContext): GuidanceBlock {
  const tradeName = ctx.trade?.heading ?? "their trade";
  const compName = ctx.competitor?.heading ?? "their current tool";

  switch (action) {
    case "book-demo":
      return {
        tag: "Book demo",
        heading: "Lock the live demo",
        body: [
          `Ask for 15 minutes on their own drawings — that's where the value lands.`,
          `Script: "Let's not talk theory — send me one plan set you're bidding and I'll run the takeoff live while you watch. Does Thursday at 2 or Friday morning work better?"`,
          `Give a binary choice of times, not an open "when are you free?".`,
          ctx.trade
            ? `Tailor it: for ${tradeName}, tee up ${ctx.trade.tip ?? "a takeoff on their plan type"}.`
            : `Confirm their trade first so you can tailor the demo plan.`,
        ],
      };

    case "fant-vestt": {
      const fMiss = fantMissing(ctx.fant);
      const vMiss = vesttMissing(ctx.vestt);
      return {
        tag: "FANT + VESTT brief",
        heading: "Where this call stands",
        body: [
          fMiss.length
            ? `FANT — still need: ${fMiss.join(", ")}. Drive questions there next.`
            : `FANT — fully qualified. This is a real, ready opportunity.`,
          vMiss.length
            ? `VESTT — not yet done: ${vMiss.join(", ")}. Don't close before you Show.`
            : `VESTT — full motion complete. Go for the trial close.`,
          ctx.competitor
            ? `Competitor in play: ${compName}. Keep the battlecard handy.`
            : `No competitor named yet — ask what they use today.`,
          ctx.role
            ? `Speaking with: ${ctx.role.heading}. ${ctx.role.tip ?? ""}`
            : `Confirm the role/authority of who you're on with.`,
        ],
      };
    }

    case "demo-close":
      return {
        tag: "Demo close",
        heading: "Close the demo cleanly",
        body: [
          `Trial close: "Based on what you just saw on your own plan — is there any reason this wouldn't save your team hours per bid?"`,
          `Stay silent after you ask. Let them answer.`,
          `If yes-but: isolate the one blocker and handle it; don't re-pitch the whole tool.`,
          ctx.role?.id === "owner"
            ? `They're the owner — go straight to next steps and terms.`
            : `If they're not the decision-maker, ask: "Who else needs to see this before you'd move?"`,
        ],
      };

    case "battlecard":
      return ctx.competitor
        ? {
            tag: "Battlecard",
            heading: ctx.competitor.heading,
            body: [
              `Signal: ${ctx.competitor.signal}`,
              ctx.competitor.talkTrack,
              ctx.competitor.tip ? `Tip: ${ctx.competitor.tip}` : "",
            ].filter(Boolean),
          }
        : {
            tag: "Battlecard",
            heading: "No competitor detected yet",
            body: [
              `Ask the discovery question first: "What are you using for takeoffs today?"`,
              `Then tap the competitor's chip — Bluebeam, STACK, PlanSwift, On-Screen Takeoff, Procore/Autodesk, Beam AI, Kreo, or Edge/Sage — for the matching battlecard.`,
            ],
          };

    case "follow-up": {
      const trade = ctx.trade ? ctx.trade.heading.toLowerCase() : "your trade";
      return {
        tag: "Follow-up",
        heading: "Follow-up email draft",
        body: [
          `Subject: Your takeoff, in minutes — quick recap`,
          `Hi [Name], great talking today. You mentioned takeoffs are eating time on ${trade} work — that's exactly what Togal is built for: it auto-detects, measures, and compares drawings at up to 98% accuracy.`,
          ctx.competitor
            ? `Since you're on ${compName}, I'll show how teams keep what works and let Togal handle the measuring.`
            : `On our next call I'll run the takeoff live on one of your plan sets.`,
          `Next step: send me a plan set you're bidding and I'll have a live takeoff ready for [day/time]. — [You]`,
        ],
      };
    }

    default:
      return { tag: "Coach", heading: "Pick an action", body: ["Choose an action below."] };
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const chipsByCategory = (cat: ChipCategory): Chip[] =>
  CHIPS.filter((c) => c.category === cat);

/* ------------------------------------------------------------------ */
/*  FANT qualify — scorecard questions                                 */
/* ------------------------------------------------------------------ */

export const FANT_THRESHOLD = 2; // checks needed to qualify a dimension

export const FANT_QUESTIONS: Record<FantKey, string[]> = {
  F: [
    "They do trade work Togal measures well — areas, counts, or linear runs.",
    "They bid from drawings / plan sets on a regular basis.",
    "Plan and bid volume is high enough for the time savings to matter.",
  ],
  A: [
    "You're talking with the decision-maker or economic buyer.",
    "If not, there's a clear, named path to that person.",
    "You know who else has to sign off on a purchase.",
  ],
  N: [
    "Takeoff time is a named pain — hours or days per bid.",
    "They lose or skip bids for lack of estimating capacity.",
    "Accuracy or rework on quantities is a stated concern.",
  ],
  T: [
    "There's an active bid or deadline creating urgency.",
    "A budget cycle or busy season is pushing a decision now.",
    "A compelling event happened — lost bid, new hire, growth target.",
  ],
};

/* ------------------------------------------------------------------ */
/*  Call script — VESTT mindset, opener, stages, post-call review      */
/* ------------------------------------------------------------------ */

export const VESTT_INTRO =
  "The VESTT Framework is more than a checklist — it's a mindset. When you approach every conversation with Value, Expertise, Structure, Triggers, and Tone, you create consistency, confidence, and conversion.";

export const OPENER = {
  title: "Open",
  goal: "Earn the next 10 minutes and find out who you're talking to.",
  lines: [
    `"Thanks for hopping on. Quick context: Togal does AI takeoff — it auto-detects, measures, and compares your drawings, up to 98% accuracy."`,
    `"Before I show anything — what's your role in the takeoff and estimating process today?"`,
    `"And what are you using for takeoffs right now?"`,
  ],
};

export interface VesttStage {
  title: string;
  tagline: string;
  goal: string;
  mindset?: string;
  principles: string[];
  lines: string[];
}

export const VESTT_SCRIPT: Record<VesttKey, VesttStage> = {
  V: {
    title: "Value",
    tagline: "Impact",
    goal: "Identify and communicate your value early — solve pain, don't pitch features.",
    principles: [
      "Identify and communicate the value you bring early.",
      "Focus on solving pain points, not just selling features.",
      "Reinforce what makes Togal worth the buyer's attention and investment.",
    ],
    lines: [
      `"Togal gets you takeoffs in minutes, not days — so you bid more work without adding headcount."`,
      `"What would one or two more bids a month be worth to you?"`,
      `"Everything I show you today ties back to time saved and bids won."`,
    ],
  },
  E: {
    title: "Expert",
    tagline: "Builds trust",
    goal: "Be the expert advisor — confidence and credibility move deals forward faster.",
    principles: [
      "Position yourself as an expert advisor, not a vendor.",
      "Confidence and credibility move deals forward faster.",
    ],
    lines: [
      `"Togal was built by estimators — we've sat in your seat, not just written software."`,
      `"The detection is purpose-trained on real construction drawings, up to 98% accuracy."`,
      `"Ask me anything about how it handles your trade — I'll give it to you straight."`,
    ],
  },
  S: {
    title: "Structure",
    tagline: "Control the conversation",
    goal: "Use a clear framework for discovery and qualification toward the demo.",
    principles: [
      "Use a clear framework for discovery and qualification toward the demo.",
      "Set expectations for every call — who, what, why, and next steps.",
      "Structure creates consistency, predictability, and professionalism.",
    ],
    lines: [
      `"Here's the plan for our 20 minutes: a couple of questions, a live takeoff on your plans, then next steps — sound good?"`,
      `"Quick recap before we move on, so we're aligned…"`,
      `"That covers discovery — let me show you on your own drawings now."`,
    ],
  },
  T1: {
    title: "Triggers",
    tagline: "Spark action with active listening",
    goal: "Listen for the cues that signal urgency and readiness to demo.",
    principles: [
      "Identify triggers that drive urgency or next steps — timing, goals, external pressures, needs, blueprints, demo-now.",
      "Use psychological and business triggers to inspire momentum.",
      "Recognize the emotional or operational cues that signal readiness to demo.",
    ],
    lines: [
      `"What's making you look at this now versus six months ago?"`,
      `"Any bids you've had to walk away from for lack of time?"`,
      `"Is there a deadline, a new hire, or a growth target driving this?"`,
    ],
  },
  T2: {
    title: "Tone",
    tagline: "Master your delivery",
    goal: "Build connection through intentional communication — voice, empathy, and energy.",
    mindset: "It's not just what you say — it's how you make them feel.",
    principles: [
      "Match the buyer's communication style — pace, tone, formality.",
      "Speak with energy, confidence, and warmth.",
      "Be comfortable with yourself.",
    ],
    lines: [
      `"Mirror their pace: crisp with a busy owner, thorough with a detail-driven estimator."`,
      `"Stay a partner helping them bid more — not a vendor pushing software."`,
      `"Confident, not salesy. Let the live takeoff do the selling."`,
    ],
  },
};

/** Self-review prompts shown at the end of the Call script tab. */
export const POST_CALL_REVIEW = [
  "Did I touch on value points?",
  "Did I position myself as an expert by guiding the prospect?",
  "Did I control the structure and flow?",
  "Did I identify and use triggers effectively?",
  "Did the call end with a booked demo, proper follow-up, or a disqualified prospect?",
];

/* ------------------------------------------------------------------ */
/*  Dangerous software — competitive landscape watch list              */
/* ------------------------------------------------------------------ */

export type ThreatLevel = "high" | "medium" | "low";

export const COMPETITOR_INTEL: Record<
  string,
  { level: ThreatLevel; what: string }
> = {
  bluebeam: {
    level: "high",
    what: "PDF markup & collaboration — deeply entrenched in the daily workflow.",
  },
  stack: {
    level: "high",
    what: "Cloud takeoff & estimating with strong brand recognition.",
  },
  planswift: {
    level: "medium",
    what: "Legacy click-by-click manual takeoff.",
  },
  ost: {
    level: "medium",
    what: "On-Screen Takeoff — legacy click-by-click manual takeoff.",
  },
  procore: {
    level: "medium",
    what: "Project & construction-management platform — not a takeoff tool.",
  },
  "beam-ai": {
    level: "medium",
    what: "Another AI-takeoff entrant competing on the same promise.",
  },
  "edge-sage": {
    level: "low",
    what: "Downstream estimating / costing systems that Togal feeds.",
  },
};

/* ------------------------------------------------------------------ */
/*  Role plays — practice prompts                                      */
/* ------------------------------------------------------------------ */

export const PRACTICE_LINES: Record<string, string> = {
  bluebeam: "We use Bluebeam in every workflow, so we're pretty set.",
  stack: "We're already on STACK for our takeoffs.",
  kreo: "We've been looking at Kreo for AI takeoff.",
  planswift: "We've used PlanSwift for years — it works fine.",
  ost: "We do all our takeoffs in On-Screen Takeoff.",
  procore: "Everything runs through Procore for us.",
  "beam-ai": "We're already taking a look at Beam AI.",
  "edge-sage": "Our estimating all lives in The EDGE.",
  manual: "We just do our takeoffs by hand in the PDF.",
  "no-budget": "There's just no budget for new software right now.",
  "dont-trust-ai": "Honestly, I don't trust AI with our numbers.",
  "too-busy": "We're slammed — I don't have time for this right now.",
  "just-info": "Can you just send me some information?",
  "tried-ai": "We tried an AI takeoff tool before and it didn't work.",
  "have-estimators": "We already have estimators who handle all this.",
  "too-complex": "This sounds complicated to roll out.",
  "need-think": "We need to think about it internally.",
  "claude-llm": "Honestly, we've just been using ChatGPT for a lot of this.",
  "it-security": "Our IT team will need to review the security first.",
};

export interface RolePlay {
  id: string;
  prompt: string;
  card: CoachingCard;
}

export function rolePlaysByCategory(cat: ChipCategory): RolePlay[] {
  return Object.entries(PRACTICE_LINES)
    .filter(([id]) => COACHING[id]?.category === cat)
    .map(([id, prompt]) => ({ id, prompt, card: COACHING[id] }));
}

/* ------------------------------------------------------------------ */
/*  Post-call analysis — local heuristic scoring of a transcript       */
/* ------------------------------------------------------------------ */

export interface CallMoment {
  line: string; // the transcript line where the signal was detected
  card: CoachingCard;
}

export interface TranscriptAnalysis {
  fantCovered: FantKey[];
  vesttCovered: VesttKey[];
  fantScore: number; // 0–4
  vesttScore: number; // 0–5
  overall: number; // 0–100
  moments: CallMoment[];
  gaps: string[]; // dimensions never reached → what to work on
}

/**
 * Scan a pasted transcript for the objections, competitors, trades and roles
 * in the knowledge base, then score how much of the FANT/VESTT motion the rep
 * touched. Heuristic + offline — the live AI replay is a later add.
 */
export function analyzeTranscript(text: string): TranscriptAnalysis {
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();

  const moments: CallMoment[] = [];
  const seen = new Set<string>();
  const fantSet = new Set<FantKey>();
  const vesttSet = new Set<VesttKey>();

  for (const card of Object.values(COACHING)) {
    const kw = card.keywords.find((k) => lower.includes(k));
    if (kw && !seen.has(card.id)) {
      seen.add(card.id);
      const line = lines.find((l) => l.toLowerCase().includes(kw)) ?? "";
      moments.push({ line, card });
      card.fant?.forEach((k) => fantSet.add(k));
      card.vestt?.forEach((k) => vesttSet.add(k));
    }
  }

  const fantCovered = FANT.map((f) => f.key).filter((k) => fantSet.has(k));
  const vesttCovered = VESTT.map((v) => v.key).filter((k) => vesttSet.has(k));
  const overall = Math.round(
    ((fantCovered.length / 4 + vesttCovered.length / 5) / 2) * 100
  );

  const gaps: string[] = [];
  FANT.filter((f) => !fantSet.has(f.key)).forEach((f) =>
    gaps.push(`FANT — ${f.full}: ${f.hint}`)
  );
  VESTT.filter((v) => !vesttSet.has(v.key)).forEach((v) =>
    gaps.push(`VESTT — ${v.full}: ${v.hint}`)
  );

  return {
    fantCovered,
    vesttCovered,
    fantScore: fantCovered.length,
    vesttScore: vesttCovered.length,
    overall,
    moments,
    gaps,
  };
}

/** A short, multi-signal transcript for the "Load sample" button. */
export const SAMPLE_TRANSCRIPT = [
  "Rep: Morning! Appreciate the few minutes. What are you using for takeoffs today?",
  "Prospect: We've run PlanSwift for years — it works fine.",
  "Rep: Makes sense. How long does a typical plan set take your team?",
  "Prospect: A big job can eat most of a day of clicking, honestly.",
  "Rep: That's the part Togal automates. Have you tried any AI takeoff tools?",
  "Prospect: I don't really trust AI to get our numbers right.",
  "Prospect: And we're slammed this month, so I don't have much time.",
  "Rep: Fair. What if you could verify every detected region yourself?",
  "Prospect: Maybe. Just send me some info and I'll take a look.",
].join("\n");

/* ------------------------------------------------------------------ */
/*  Practice scenario — configurable live-roleplay setup               */
/* ------------------------------------------------------------------ */

export const SCENARIO_PROSPECT_TYPES = [
  "Owner — drywall sub",
  "Owner — painting/wallpaper",
  "Estimator — concrete",
  "Estimator — electrical",
  "PM/Precon — general contractor",
  "Owner — flooring",
];

export interface ScenarioObjection {
  id: string;
  label: string;
  opener: string; // how the prospect opens the call
  coaching: string[]; // how to handle it
}

export const SCENARIO_OBJECTIONS: ScenarioObjection[] = [
  {
    id: "happy",
    label: "Happy with current tool",
    opener: "Honestly, we're happy with what we've got.",
    coaching: [
      "They're not in pain yet — your job is to create contrast.",
      "Ask what their current tool can't do, then show that gap on their plans.",
      "Offer a head-to-head takeoff on a live bid.",
    ],
  },
  {
    id: "no-budget",
    label: "No budget",
    opener: "There's just no budget for new software right now.",
    coaching: [
      "Anchor to ROI, not price.",
      "Quantify: what's a won bid worth, and how many do they skip for lack of time?",
    ],
  },
  {
    id: "dont-trust",
    label: "Don't trust AI",
    opener: "I don't trust AI with our numbers.",
    coaching: [
      "Reframe as a verifiable co-pilot — they verify every region.",
      "Show correcting a detected region live so oversight feels easy.",
    ],
  },
  {
    id: "too-busy",
    label: "Too busy",
    opener: "We're slammed — I don't have time for this right now.",
    coaching: [
      "Turn 'busy' into urgency: takeoffs are what's eating the week.",
      "Ask for 15 minutes on a live plan set.",
    ],
  },
  {
    id: "tried-ai",
    label: "Tried AI before",
    opener: "We tried an AI takeoff tool before and it didn't work.",
    coaching: [
      "Diagnose the prior failure first.",
      "Differentiate: built by estimators, auto-detect, revision comparison.",
    ],
  },
  {
    id: "estimators",
    label: "We have estimators",
    opener: "We already have estimators who handle all this.",
    coaching: [
      "Position as a force-multiplier, not a replacement.",
      "More bids per estimator, fewer late nights.",
    ],
  },
  {
    id: "need-think",
    label: "Need to think about it",
    opener: "We'll need to think about it internally.",
    coaching: [
      "Surface the real blocker — info, a stakeholder, or confidence.",
      "Convert the stall into a scheduled next step with the right people.",
    ],
  },
];

export type Difficulty = "Easy" | "Challenging" | "Hard";

export const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  Easy: "Receptive and chatty. Gives you room — use it to practice your structure.",
  Challenging: "Guarded. Pushes back once or twice before opening up.",
  Hard: "Curt and skeptical. Short answers, ready to end the call — earn every minute.",
};

export interface Scenario {
  title: string;
  opener: string;
  persona: string;
  coaching: string[];
}

export function buildScenario(
  prospectType: string,
  objection: ScenarioObjection,
  difficulty: Difficulty
): Scenario {
  return {
    title: `${prospectType} · ${objection.label} · ${difficulty}`,
    opener: objection.opener,
    persona: `${prospectType}. ${DIFFICULTY_NOTE[difficulty]}`,
    coaching: objection.coaching,
  };
}

/* ------------------------------------------------------------------ */
/*  Knowledge base — grounds the Ask bar's free-form answers           */
/*  (distilled from Togal's sales collateral + the data in this file)  */
/* ------------------------------------------------------------------ */

const KB_FACTS = `## Togal.AI — company & product
- AI-powered takeoff & preconstruction platform, built by estimators/builders (born from a family construction business). "Builders before tech."
- Cloud-based: auto-detects, measures, counts, and organizes quantities straight from construction drawings, and compares revisions side-by-side — minutes, not days.
- Up to 98% detection accuracy; ~80% average takeoff time savings. Tagline: "Takeoff in minutes, not days."
- US-owned, Florida-based. You keep control of your data. A co-pilot, not autopilot — the AI does the first pass, the estimator verifies every region.
- Key features: AI auto-detect (areas/linear/counts), AI image search, Togal GPT, automatic scale detection, arc & circle cuts, advanced geometry, custom formulas, repeating groups, split/merge, search, 3D view, automated drawing/revision comparison, real-time cloud collaboration, iPad support, organized/grouped exports. Feeds downstream estimating (The EDGE, Sage).

## Independent University of Kansas study (Marulanda et al., via Simplar Foundation), Togal vs On-Screen Takeoff
- ~70% average takeoff time savings (≈75.6% on a fire-station plan set, ≈66.6% on a multistory hotel; up to ~76% on a single plan set). One floor plan: ~49 seconds of AI vs ~1h5m manual in OST.
- Accuracy within ~5% of OST after quick human adjustments; bigger % gaps were only on tiny quantities.
- Conclusion: AI works best paired with the estimator's judgment, not replacing it. The AI is weaker on low-quality/scanned drawings and can miss projections/legend items — so verification matters.
- Clark Construction moved 170 estimators from OST to Togal.

## Customer proof points
- Total Flooring: took off a 30-story high-rise in 48 hours (normally ~2 weeks of clicking), won the bid, and caught an expensive plan error the GC had missed.
- NC Painting: went from 19 bids/month on Bluebeam to 60 bids/month with the same team.
- Illusions Painting: takeoffs went from two weeks to "the blink of an eye," with the whole team collaborating in real time; 3D view helps the field paint the right wall.
- Select Painting: significantly faster estimates and more bids; 3D view reduces rework.
- Consigli (≈$4B/yr GC, 80–100 estimators): switched from On-Screen Takeoff (used 25 years) for cloud-based real-time collaboration; values "better estimates, not just faster" (estimators spend time on judgment, not clicking).
- Coastal Construction: 50–65% less total preconstruction effort, 140–230 hours saved per project, 60–70% faster ROM pricing, automated drawing comparison across design iterations.

## "AI or BS" — how a real AI tool proves itself (use to coach skeptical buyers)
- Real AI changes outcomes with measurable numbers (hours saved per bid, rework cut, takeoff speed, bid-rate lift) — not buzzwords.
- No AI is 100% accurate out of the box; what matters is how easy cleanup is and that you verify. Beware "99% accurate" claims with no methodology.
- Ask about data & security (SOC 1/SOC 2, offshore handling, co-mingled data), implementation reality, and whether removing the "AI" label would change the product (AI-washing).`;

/** Compiled, plain-text knowledge base the Ask bar passes to the model. */
export function buildKnowledgeBase(): string {
  const cards = Object.values(COACHING)
    .map(
      (c) =>
        `• ${c.heading} [${c.category} / ${c.tag}]\n  Signal: ${
          c.signal ?? "—"
        }\n  Talk track: ${c.talkTrack}\n  Tip: ${c.tip ?? "—"}`
    )
    .join("\n");
  const comps = Object.values(COMPARISONS)
    .map(
      (c) =>
        `Togal vs ${c.them}${c.proof ? ` — ${c.proof}` : ""}\n` +
        c.rows
          .map(
            (r) =>
              `  - ${r.feature}: Togal ${r.togal ? "yes" : "no"} / ${c.them} ${
                r.them ? "yes" : "no"
              }`
          )
          .join("\n")
    )
    .join("\n");
  const frameworks =
    `FANT (qualify): ${FANT.map((f) => `${f.label}=${f.full} (${f.hint})`).join(
      "; "
    )}\n` +
    `VESTT (call motion): ${VESTT.map(
      (v) => `${v.label}=${v.full} (${v.hint})`
    ).join("; ")}`;
  return [
    KB_FACTS,
    "## Battlecards & talk tracks",
    cards,
    "## Competitor comparisons",
    comps,
    "## Frameworks",
    frameworks,
  ].join("\n\n");
}

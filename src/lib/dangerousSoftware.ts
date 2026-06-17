// Dangerous-software watch list, organised by trade. Each trade lists the
// takeoff/estimating tools a rep is likely to run into, with optional notes
// (things to ask or watch for on a live call).

export interface TradeSoftware {
  name: string;
  notes?: string[];
}

export interface TradeGroup {
  id: string;
  label: string;
  software: TradeSoftware[];
  footnote?: string;
}

export const TRADE_SOFTWARE: TradeGroup[] = [
  {
    id: "flooring",
    label: "Flooring Subcontractor",
    software: [{ name: "MeasureSquare" }, { name: "RFMS Measure" }],
  },
  {
    id: "drywall",
    label: "Drywall Subcontractor",
    software: [
      { name: "OST + QuickBid" },
      {
        name: "PlanSwift",
        notes: ["Make sure they're actually using assemblies."],
      },
      { name: "Estimating Edge" },
      { name: "BuzzBid" },
    ],
  },
  {
    id: "concrete",
    label: "Concrete / Shell Subcontractor",
    software: [
      { name: "OST + QuickBid" },
      {
        name: "PlanSwift",
        notes: ["Make sure they're actually using assemblies."],
      },
      { name: "BuzzBid" },
    ],
  },
  {
    id: "electrical-mechanical",
    label: "Electrical / Mechanical",
    software: [
      { name: "Accubid" },
      { name: "Calidus" },
      {
        name: "McCormick",
        notes: [
          "Ask about the need and why — is it speed?",
          "How are they using it today?",
        ],
      },
    ],
  },
  {
    id: "civil",
    label: "Civil Subcontractors",
    software: [{ name: "HCSS HeavyBid" }, { name: "AGTEK" }, { name: "Trimble" }],
    footnote:
      "Anything other than Bluebeam / OST is fair game — ask what it does that Togal can't, then offer a head-to-head.",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    software: [{ name: "FastPIPE" }, { name: "QuoteSoft" }],
  },
  {
    id: "masonry",
    label: "Masonry",
    software: [{ name: "Tradesman" }],
  },
  {
    id: "glazing",
    label: "Glazing — Storefront / Curtain walls",
    software: [
      {
        name: "Bluebeam",
        notes: [
          "Residential vs. commercial — if residential, no demo.",
          "Punch windows?",
          "Look for window tags.",
          "If they're not counting quantities, hold off.",
        ],
      },
    ],
  },
];

export const DEFAULT_SOFTWARE_NOTE =
  "Incumbent takeoff/estimating tool for this trade.";

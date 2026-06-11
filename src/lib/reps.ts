// BDR booking directory — HubSpot meeting round-robin links by segment.

export type Segment = "Mid Market" | "Strategic" | "SMB";

export interface BDR {
  name: string;
  segment: Segment;
  url: string;
}

export const BDRS: BDR[] = [
  {
    name: "Andrea",
    segment: "Mid Market",
    url: "https://meetings.hubspot.com/andrea-card/mm-rr",
  },
  {
    name: "David",
    segment: "Mid Market",
    url: "https://meetings.hubspot.com/david-velasquez4/mid-market-round-robin-david",
  },
  {
    name: "Jake",
    segment: "Mid Market",
    url: "https://meetings.hubspot.com/jake983/mid-market-round-robin-jake",
  },
  {
    name: "Alex",
    segment: "Strategic",
    url: "https://meetings.hubspot.com/abaxley/ent-rr",
  },
  {
    name: "Nick",
    segment: "Strategic",
    url: "https://meetings.hubspot.com/nmeyer3/strategic-demo-rotation",
  },
  {
    name: "Brandon",
    segment: "SMB",
    url: "https://meetings.hubspot.com/brandon-myles/mm-rr",
  },
  {
    name: "Sean",
    segment: "SMB",
    url: "https://meetings.hubspot.com/skirt/sean-togalai",
  },
];

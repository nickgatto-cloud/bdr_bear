// Server-only HubSpot helpers. Token is read from the environment; never client.
const HS_BASE = "https://api.hubapi.com";

export interface HubContact {
  name: string | null;
  company: string | null;
  jobTitle: string | null;
}

function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Look up a HubSpot contact by phone number (matches on the last 10 digits). */
export async function hubspotContactByPhone(
  rawNumber: string
): Promise<HubContact | null> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return null;
  const last10 = digitsOnly(rawNumber).slice(-10);
  if (last10.length < 7) return null;

  try {
    const res = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        limit: 1,
        properties: ["firstname", "lastname", "company", "jobtitle"],
        // phone numbers live in either field and in varied formats — match the
        // local 10-digit token across both
        filterGroups: [
          { filters: [{ propertyName: "phone", operator: "CONTAINS_TOKEN", value: last10 }] },
          { filters: [{ propertyName: "mobilephone", operator: "CONTAINS_TOKEN", value: last10 }] },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { properties?: Record<string, string | null> }[];
    };
    const p = data.results?.[0]?.properties;
    if (!p) return null;
    return {
      name: [p.firstname, p.lastname].filter(Boolean).join(" ") || null,
      company: p.company ?? null,
      jobTitle: p.jobtitle ?? null,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Company intel — look up customer/prospect companies by state/trade */
/* ------------------------------------------------------------------ */

/** The `trade` enumeration values as configured in this HubSpot portal. */
export const COMPANY_TRADES = [
  "Civil/Site Work",
  "Concrete",
  "Drywall",
  "Drywall - Windows",
  "Electrical",
  "FFE",
  "Flooring",
  "Furniture, Fixtures & Equipment",
  "General Contractor",
  "Glazing & Doors",
  "Glazing/Windows & Doors",
  "Home Builder",
  "HVAC",
  "MEP",
  "Owner Rep",
  "Paint & Wall Coverings",
  "Painting & Wallpaper",
  "Plumbing",
  "Roofing",
  "Supplier",
  "Other",
] as const;

// Trades that exist under more than one label — search them together so a rep
// asking for "painting" gets both buckets.
const TRADE_SYNONYMS: Record<string, string[]> = {
  "Painting & Wallpaper": ["Painting & Wallpaper", "Paint & Wall Coverings"],
  "Paint & Wall Coverings": ["Painting & Wallpaper", "Paint & Wall Coverings"],
  "Glazing & Doors": ["Glazing & Doors", "Glazing/Windows & Doors"],
  "Glazing/Windows & Doors": ["Glazing & Doors", "Glazing/Windows & Doors"],
  "Drywall": ["Drywall", "Drywall - Windows"],
  "FFE": ["FFE", "Furniture, Fixtures & Equipment"],
  "Furniture, Fixtures & Equipment": ["FFE", "Furniture, Fixtures & Equipment"],
};

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC", "washington dc": "DC", "washington d.c.": "DC",
};

/** Accept a 2-letter code or a full state name, return the 2-letter code. */
export function toStateCode(input: string): string | null {
  const s = (input ?? "").trim().toLowerCase();
  if (!s) return null;
  if (/^[a-z]{2}$/.test(s)) return s.toUpperCase();
  return US_STATES[s] ?? null;
}

export interface HubCompany {
  name: string | null;
  city: string | null;
  state: string | null;
  trade: string | null;
  domain: string | null;
}

/**
 * Search HubSpot companies by US state and/or trade. Returns the matching
 * companies (capped) and the total count. Token is server-side only.
 */
export async function searchHubspotCompanies(opts: {
  state?: string | null;
  trade?: string | null;
  limit?: number;
}): Promise<{ companies: HubCompany[]; total: number } | { error: string }> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return { error: "HubSpot isn't connected (HUBSPOT_ACCESS_TOKEN)." };

  const stateCode = opts.state ? toStateCode(opts.state) : null;
  const stateFilter = opts.state
    ? stateCode
      ? { propertyName: "hs_state_code", operator: "EQ", value: stateCode }
      : { propertyName: "state", operator: "EQ", value: opts.state }
    : null;

  const trades = opts.trade ? TRADE_SYNONYMS[opts.trade] ?? [opts.trade] : [];

  if (!stateFilter && !trades.length) {
    return { error: "Specify a state and/or a trade to search." };
  }

  // filters within a group are AND'd; groups are OR'd → (state AND trade-in-set)
  const filterGroups = trades.length
    ? trades.map((t) => ({
        filters: [
          ...(stateFilter ? [stateFilter] : []),
          { propertyName: "trade", operator: "EQ", value: t },
        ],
      }))
    : [{ filters: [stateFilter!] }];

  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);

  try {
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/objects/companies/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          limit,
          properties: ["name", "city", "state", "hs_state_code", "trade", "domain"],
          filterGroups,
          sorts: [{ propertyName: "name", direction: "ASCENDING" }],
        }),
      }
    );
    if (!res.ok) {
      return { error: `HubSpot API error (${res.status}).` };
    }
    const data = (await res.json()) as {
      total?: number;
      results?: { properties?: Record<string, string | null> }[];
    };
    const companies: HubCompany[] = (data.results ?? []).map((r) => {
      const p = r.properties ?? {};
      return {
        name: p.name ?? null,
        city: p.city ?? null,
        state: p.state ?? p.hs_state_code ?? null,
        trade: p.trade ?? null,
        domain: p.domain ?? null,
      };
    });
    return { companies, total: data.total ?? companies.length };
  } catch {
    return { error: "Couldn't reach HubSpot." };
  }
}

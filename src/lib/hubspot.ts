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

// Server-only Aircall helpers. The API ID + token are read from the environment
// and combined into a Basic auth header; never expose them to the client.
export const AIRCALL_BASE = "https://api.aircall.io/v1";

export function aircallAuth(): string | null {
  const id = process.env.AIRCALL_API_ID;
  const token = process.env.AIRCALL_API_KEY;
  if (!id || !token) return null;
  return "Basic " + Buffer.from(`${id}:${token}`).toString("base64");
}

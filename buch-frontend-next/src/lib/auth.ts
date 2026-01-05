export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Login fehlgeschlagen (${res.status}): ${text || res.statusText}`
    );
  }

  const data = (await res.json()) as TokenResponse;

  if (!data.access_token) {
    throw new Error("Login: Keine access_token im Response.");
  }

  localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);

  return data;
}

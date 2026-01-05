/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Agent } from "undici";
import { cookies } from "next/headers";

type FetchInitWithDispatcher = RequestInit & { dispatcher?: Agent };

const insecureDispatcher = new Agent({
  connect: { rejectUnauthorized: false }, // NUR DEV
});

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, status: 500, body: "API_BASE_URL fehlt" },
      { status: 500 }
    );
  }

  // Auth weitergeben (wenn vorhanden)
  const authFromReq = req.headers.get("authorization");
  const cookieToken = (await cookies()).get("access_token")?.value;
  const auth = authFromReq ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);

  // Query: hol nur IDs (klein) und zähle im Frontend
  const query = /* GraphQL */ `
    query BuchCount {
      buecher {
        id
      }
    }
  `;

  const res = await fetch(`${baseUrl}/graphql`, {
    method: "POST",
    cache: "no-store",
    dispatcher: insecureDispatcher,
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify({ query, variables: {} }),
  } as FetchInitWithDispatcher);

  const text = await res.text();
  const body = safeJson(text);

  // Wenn GraphQL Errors -> direkt zurück
  if (!res.ok) {
    return NextResponse.json({ ok: false, status: res.status, body }, { status: 200 });
  }

  // Erwartet: { data: { buecher: [{id}, ...] } }
  const list = (body as any)?.data?.buecher;
  const count = Array.isArray(list) ? list.length : null;

  return NextResponse.json(
    { ok: true, status: res.status, body: { count, raw: body } },
    { status: 200 }
  );
}

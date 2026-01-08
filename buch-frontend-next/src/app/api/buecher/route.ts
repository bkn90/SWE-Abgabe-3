import { NextResponse } from "next/server";
import { Agent } from "undici";

type FetchInitWithDispatcher = RequestInit & { dispatcher?: Agent };

const insecureDispatcher = new Agent({
  connect: { rejectUnauthorized: false }, // NUR DEV
});

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "API_BASE_URL fehlt" },
      { status: 500 },
    );
  }

  const url = `${baseUrl}/rest`;

  try {
    const auth = req.headers.get("authorization") ?? "";

    const bodyText = await req.text();

    const init: FetchInitWithDispatcher = {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": req.headers.get("content-type") ?? "application/json",
        ...(auth ? { authorization: auth } : {}),
      },
      body: bodyText,
    };

    if (baseUrl.startsWith("https://")) {
      init.dispatcher = insecureDispatcher;
    }

    const r = await fetch(url, init);
    const text = await r.text();

    return NextResponse.json(
      { ok: r.ok, status: r.status, url, body: safeJson(text), raw: text },
      { status: r.ok ? 200 : r.status },
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, status: 500, url, error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  return "Unbekannter Fehler";
}

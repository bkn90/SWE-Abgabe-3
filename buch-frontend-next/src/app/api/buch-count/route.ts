import { NextResponse } from "next/server";
import { Agent } from "undici";

type FetchInitWithDispatcher = RequestInit & { dispatcher?: Agent };

const insecureDispatcher = new Agent({
  connect: { rejectUnauthorized: false }, // NUR DEV
});

export async function GET() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "API_BASE_URL fehlt" },
      { status: 500 }
    );
  }

  const urlObj = new URL(`${baseUrl}/rest`);
  urlObj.searchParams.set("only", "count");
  const url = urlObj.toString();

  try {
    const init: FetchInitWithDispatcher = {
      cache: "no-store",
      headers: { Accept: "application/json" },
    };

    if (baseUrl.startsWith("https://")) {
      init.dispatcher = insecureDispatcher;
    }

    const r = await fetch(url, init);
    const text = await r.text();

    return NextResponse.json(
      { ok: r.ok, status: r.status, url, body: safeJson(text), raw: text },
      { status: r.ok ? 200 : r.status }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, status: 500, url, error: getErrorMessage(e) },
      { status: 500 }
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
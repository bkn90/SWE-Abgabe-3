import { NextResponse } from "next/server";
import { Agent } from "undici";

type FetchInitWithDispatcher = RequestInit & { dispatcher?: Agent };

const insecureDispatcher = new Agent({
  connect: { rejectUnauthorized: false }, // NUR DEV bei self-signed cert
});

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

export async function GET() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, status: 500, body: "API_BASE_URL fehlt" },
      { status: 500 },
    );
  }

  try {
    // Backend hat oft /health/readiness oder /health/liveness
    const urls = [`${baseUrl}/health/readiness`, `${baseUrl}/health`];

    let lastRes: Response | null = null;

    for (const url of urls) {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        dispatcher: insecureDispatcher,
      } as FetchInitWithDispatcher);

      lastRes = res;

      // wenn gefunden, nimm das Ergebnis
      if (res.status !== 404) {
        const text = await res.text();
        return NextResponse.json(
          { ok: res.ok, status: res.status, body: safeJson(text) },
          { status: 200 },
        );
      }
    }

    // falls beide 404 waren:
    const text = lastRes ? await lastRes.text() : "Kein Response";
    return NextResponse.json(
      { ok: false, status: lastRes?.status ?? 0, body: safeJson(text) },
      { status: 200 },
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, status: 0, body: getErrorMessage(e) },
      { status: 200 },
    );
  }
}

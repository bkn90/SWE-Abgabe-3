// src/app/api/buecher/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // Next (aktuelle Version): params ist ein Promise
  const { id } = await ctx.params;

  // Backend läuft bei dir per TLS auf :3000 (siehe curl https funktioniert)
  const backendUrl = `https://127.0.0.1:3000/rest/${encodeURIComponent(id)}`;

  // DEV: Self-signed Zertifikat akzeptieren (nur lokal!)
  if (process.env.NODE_ENV !== "production") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  // Wenn Backend geschützt ist: Authorization vom Client durchreichen
  const auth = req.headers.get("authorization");

  const res = await fetch(backendUrl, {
    cache: "no-store",
    headers: auth ? { authorization: auth } : undefined,
  });

  // Backend-Antwort sauber “durchreichen”
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}
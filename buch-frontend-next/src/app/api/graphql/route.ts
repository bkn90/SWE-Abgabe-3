// src/app/api/graphql/route.ts
import { Agent, fetch as undiciFetch } from "undici";

export const runtime = "nodejs";

const agent = new Agent({
  connect: { rejectUnauthorized: false }, // nur DEV!
});

export async function POST(req: Request) {
  const body = await req.text();

  const res = await undiciFetch("https://localhost:3000/graphql", {
    method: "POST",
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
      accept: req.headers.get("accept") ?? "application/json",
      // wichtig: Auth-Header durchreichen, falls vorhanden
      authorization: req.headers.get("authorization") ?? "",
    },
    body,
    dispatcher: agent,
  });

  const text = await res.text();

  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

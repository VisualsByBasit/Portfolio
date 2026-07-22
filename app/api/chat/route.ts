import { NextRequest, NextResponse } from "next/server";
import { ORION_SYSTEM_PROMPT } from "@/lib/orion-prompt";

/**
 * ORION's backend. Talks to Gemini over the plain REST endpoint (no SDK
 * installed in this project) and never lets the key, a raw error, or a
 * stack trace reach the client - every response is a valid, in-character
 * JSON payload the widget can render directly.
 */

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_EXCHANGES = 10; // last N user+model pairs kept for context
const RATE_LIMIT_MAX = 10; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const RATE_LIMIT_CLEANUP_MS = 5 * 60_000;

type ChatMessage = { role: "user" | "model"; text: string };

type OrionReply = { reply: string; accent?: boolean };

// ---------------------------------------------------------------------
// In-memory rate limiter, keyed by IP. No external store needed for a
// single-instance portfolio site; the periodic sweep keeps the map from
// growing unbounded.
// ---------------------------------------------------------------------
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

declare global {
  // module-scoped singleton guard across hot reloads
  var __orionCleanupStarted: boolean | undefined;
}

if (!global.__orionCleanupStarted) {
  global.__orionCleanupStarted = true;
  setInterval(() => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    for (const [ip, timestamps] of hits) {
      const kept = timestamps.filter((t) => t > cutoff);
      if (kept.length === 0) hits.delete(ip);
      else hits.set(ip, kept);
    }
  }, RATE_LIMIT_CLEANUP_MS).unref?.();
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ---------------------------------------------------------------------
// Origin/referer check - reject requests that didn't come from this
// site's own pages so the endpoint can't be casually called from an
// external script. Localhost is always allowed for local development.
// ---------------------------------------------------------------------
function isAllowedOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const candidate = req.headers.get("origin") ?? req.headers.get("referer");
  if (!candidate) return false;

  let candidateHost: string;
  try {
    candidateHost = new URL(candidate).host;
  } catch {
    return false;
  }

  if (candidateHost === host) return true;

  const localHosts = ["localhost", "127.0.0.1", "[::1]"];
  const candidateHostname = candidateHost.split(":")[0];
  return localHosts.includes(candidateHostname);
}

function jsonReply(body: OrionReply, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return jsonReply(
      { reply: "This channel isn't recognized. I only respond from Abdulbasit's site.", accent: true },
      403,
    );
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return jsonReply(
      { reply: "Too many requests - please give me a moment to recalibrate.", accent: true },
      429,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonReply({ reply: "That request didn't parse. Try sending your message again." }, 400);
  }

  const { message, history } = (body ?? {}) as {
    message?: unknown;
    history?: unknown;
  };

  if (typeof message !== "string") {
    return jsonReply({ reply: "I need a text message to respond to." }, 400);
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return jsonReply({ reply: "That came through empty - go ahead and ask me something." }, 400);
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return jsonReply(
      { reply: `Could you keep that under ${MAX_MESSAGE_LENGTH} characters? Trim it down and I'll take another look.` },
      400,
    );
  }

  const safeHistory: ChatMessage[] = Array.isArray(history)
    ? history
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            (m.role === "user" || m.role === "model") &&
            typeof m.text === "string",
        )
        .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_LENGTH) }))
        .slice(-MAX_HISTORY_EXCHANGES * 2)
    : [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonReply(
      { reply: "My connection to the knowledge core isn't configured yet. Try again shortly.", accent: true },
      500,
    );
  }

  try {
    const contents = [
      ...safeHistory.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: trimmed }] },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ORION_SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return jsonReply(
        {
          reply:
            status === 429
              ? "My knowledge core is under heavy load right now - give me a moment and ask again."
              : "I hit some interference reaching my knowledge core. Try again in a moment.",
          accent: true,
        },
        status,
      );
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      return jsonReply(
        { reply: "I couldn't form a response to that. Could you rephrase it?", accent: true },
        200,
      );
    }

    return jsonReply({ reply: text });
  } catch {
    return jsonReply(
      { reply: "Something interrupted that request on my end. Try again in a moment.", accent: true },
      500,
    );
  }
}

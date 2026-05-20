import { NextRequest } from "next/server";
import { runTournament } from "@/lib/tournament";
import { checkRateLimit } from "@/lib/rateLimit";
import type { RunRequest, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_MAX_HITS = parseInt(process.env.RATE_LIMIT_PER_DAY ?? "3", 10);

function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, RATE_WINDOW_MS, RATE_MAX_HITS);
  if (!rl.allowed) {
    const hoursLeft = Math.ceil(rl.resetMs / (60 * 60 * 1000));
    return new Response(
      JSON.stringify({
        error: `Daily limit reached (${RATE_MAX_HITS}/day). Resets in ~${hoursLeft}h.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RunRequest;
  try {
    body = (await req.json()) as RunRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.task || typeof body.task !== "string" || body.task.trim().length < 8) {
    return new Response(
      JSON.stringify({ error: "task must be a string with at least 8 characters" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (body.task.length > 4000) {
    return new Response(JSON.stringify({ error: "task too long (max 4000 chars)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      try {
        await runTournament(
          {
            task: body.task,
            maxPasses: body.maxPasses,
            numJudges: body.numJudges,
            model: body.model,
            apiKey,
          },
          send,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

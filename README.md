# Schlooms

Live, in-browser console for the **autoreason** self-refinement tournament from
[NousResearch/autoreason](https://github.com/NousResearch/autoreason) (SHL0MS · Hermes Agent).
You give it a writing/planning task; it runs the A/B/AB tournament for you
with real LLM calls, streaming each phase as it happens.

The research, the method, and the system prompts are all from the upstream paper
— this repo is just a UI that puts the loop in front of a browser.

## What the loop does

Each pass:

1. **Author** drafts version `A` (or carries `A` forward from the previous pass).
2. **Critic** (fresh agent) reads `A` and lists only flaws — no fixes.
3. **Reviser** (fresh agent) addresses the listed flaws → version `B`.
4. **Synthesizer** (fresh agent) fuses `A` and `B` → version `AB`.
5. **Judge panel** of N fresh agents ranks the three; Borda count picks the winner.
6. If the unchanged `A` wins **twice in a row** → converged.
   Otherwise, the winner becomes the new `A` and the loop repeats.

The fresh-agent rule and "do nothing" being a first-class ballot option are
what keep weak models from scope-creeping or hallucinating flaws.

## Running locally

```bash
npm install
cp .env.example .env.local
# edit .env.local — set OPENROUTER_API_KEY
npm run dev
```

Open <http://localhost:3000>.

### Configuration

| env var | default | meaning |
|---|---|---|
| `OPENROUTER_API_KEY` | — | required (https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | `anthropic/claude-sonnet-4.5` | any OpenRouter model id |
| `RATE_LIMIT_PER_DAY` | `3` | runs allowed per client IP per 24h |

Inference goes through OpenRouter so you can swap models freely — try
`openai/gpt-4o`, `google/gemini-2.5-pro`, `meta-llama/llama-3.3-70b-instruct`,
etc. without changing code.

### Cost note

Each pass is roughly 3 streamed generations + N judge calls. With 3 passes
and 3 judges that's ~12 short LLM calls per run. Budget accordingly; the
in-memory rate limiter caps daily runs per IP to keep things bounded.

## Stack

- Next.js 16 App Router (Node runtime, SSE via `ReadableStream`)
- `openai` SDK pointed at `https://openrouter.ai/api/v1` for streaming completions
- Tailwind v4 + a deliberately stark monochrome aesthetic
- In-memory IP rate limit — replace with Redis/Upstash if you ever scale past one instance

## File layout

```
app/
  page.tsx                  masthead, loop diagram, mounts <Tournament />
  api/tournament/route.ts   POST SSE endpoint that runs the loop
  layout.tsx, globals.css
components/
  Tournament.tsx            interactive UI — owns the SSE connection
lib/
  prompts.ts                AUTHOR/CRITIC/AUTHOR_B/SYNTH/JUDGE system + user prompts
  tournament.ts             the loop itself
  rateLimit.ts              per-IP daily cap
  types.ts                  shared event/role/phase types
```

## Credit

Method, prompts, and experimental results: [NousResearch/autoreason](https://github.com/NousResearch/autoreason).
Paper: *Autoreason: Self-Refinement That Knows When to Stop*, SHL0MS · Hermes Agent.

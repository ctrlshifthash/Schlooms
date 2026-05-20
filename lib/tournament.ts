import OpenAI from "openai";
import {
  AUTHOR_SYSTEM,
  CRITIC_SYSTEM,
  AUTHOR_B_SYSTEM,
  SYNTHESIZER_SYSTEM,
  JUDGE_SYSTEM,
  GENERATE_A,
  CRITIC_PROMPT,
  AUTHOR_B_PROMPT,
  SYNTHESIZER_PROMPT,
  JUDGE_PROMPT,
} from "./prompts";
import type { Phase, Role, StreamEvent } from "./types";

type Emit = (event: StreamEvent) => void;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MAX_TOKENS_AUTHOR = 2048;
const MAX_TOKENS_CRITIC = 1024;
const MAX_TOKENS_JUDGE = 256;

function makeClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      // OpenRouter optional analytics headers — identifies the app on their dashboard.
      "HTTP-Referer": "https://github.com/ctrlshifthash/Schlooms",
      "X-Title": "Schlooms - autoreason console",
    },
  });
}

async function streamCompletion(
  client: OpenAI,
  model: string,
  system: string,
  userPrompt: string,
  maxTokens: number,
  onToken: (t: string) => void,
): Promise<string> {
  const stream = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      onToken(delta);
    }
  }
  return full;
}

async function getJudgeRanking(
  client: OpenAI,
  model: string,
  task: string,
  a: string,
  b: string,
  ab: string,
): Promise<{ ranking: Role[]; reason: string }> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: MAX_TOKENS_JUDGE,
    messages: [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: JUDGE_PROMPT(task, a, b, ab) },
    ],
  });
  const text = response.choices?.[0]?.message?.content ?? "";

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return { ranking: ["A", "B", "AB"], reason: "judge output malformed" };
  }
  try {
    const parsed = JSON.parse(match[0]);
    const ranking = parsed.ranking as Role[];
    const valid: Role[] = ["A", "B", "AB"];
    if (
      !Array.isArray(ranking) ||
      ranking.length !== 3 ||
      !ranking.every((r) => valid.includes(r)) ||
      new Set(ranking).size !== 3
    ) {
      return { ranking: ["A", "B", "AB"], reason: "judge ranking invalid" };
    }
    return { ranking, reason: String(parsed.reason ?? "") };
  } catch {
    return { ranking: ["A", "B", "AB"], reason: "judge JSON parse failed" };
  }
}

function bordaCount(rankings: Role[][]): Record<Role, number> {
  const scores: Record<Role, number> = { A: 0, B: 0, AB: 0 };
  for (const ranking of rankings) {
    scores[ranking[0]] += 3;
    scores[ranking[1]] += 2;
    scores[ranking[2]] += 1;
  }
  return scores;
}

function winner(borda: Record<Role, number>): Role {
  const entries = (Object.entries(borda) as [Role, number][]).sort(
    (x, y) => y[1] - x[1],
  );
  return entries[0][0];
}

export interface RunOptions {
  task: string;
  maxPasses?: number;
  numJudges?: number;
  model?: string;
  apiKey: string;
  defaultModel: string;
}

export async function runTournament(opts: RunOptions, emit: Emit): Promise<void> {
  const client = makeClient(opts.apiKey);
  const model = opts.model ?? opts.defaultModel;
  const maxPasses = Math.min(Math.max(opts.maxPasses ?? 3, 1), 5);
  const numJudges = Math.min(Math.max(opts.numJudges ?? 3, 1), 5);

  const phaseStart = (pass: number, phase: Phase, label: string) =>
    emit({ type: "phase_start", pass, phase, label });
  const token = (pass: number, phase: Phase, text: string) =>
    emit({ type: "token", pass, phase, text });
  const phaseDone = (pass: number, phase: Phase, content: string) =>
    emit({ type: "phase_done", pass, phase, content });

  emit({ type: "pass_start", pass: 1 });
  phaseStart(1, "author", "Author drafts version A");
  let versionA = await streamCompletion(
    client,
    model,
    AUTHOR_SYSTEM,
    GENERATE_A(opts.task),
    MAX_TOKENS_AUTHOR,
    (t) => token(1, "author", t),
  );
  phaseDone(1, "author", versionA);

  let aWinStreak = 0;
  let lastFinal = versionA;

  for (let pass = 1; pass <= maxPasses; pass++) {
    if (pass > 1) emit({ type: "pass_start", pass });

    phaseStart(pass, "critic", "Critic finds flaws");
    const critique = await streamCompletion(
      client,
      model,
      CRITIC_SYSTEM,
      CRITIC_PROMPT(opts.task, versionA),
      MAX_TOKENS_CRITIC,
      (t) => token(pass, "critic", t),
    );
    phaseDone(pass, "critic", critique);

    phaseStart(pass, "authorB", "Reviser writes B");
    const versionB = await streamCompletion(
      client,
      model,
      AUTHOR_B_SYSTEM,
      AUTHOR_B_PROMPT(opts.task, versionA, critique),
      MAX_TOKENS_AUTHOR,
      (t) => token(pass, "authorB", t),
    );
    phaseDone(pass, "authorB", versionB);

    phaseStart(pass, "synth", "Synthesizer fuses A and B into AB");
    const versionAB = await streamCompletion(
      client,
      model,
      SYNTHESIZER_SYSTEM,
      SYNTHESIZER_PROMPT(opts.task, versionA, versionB),
      MAX_TOKENS_AUTHOR,
      (t) => token(pass, "synth", t),
    );
    phaseDone(pass, "synth", versionAB);

    phaseStart(pass, "judges", `${numJudges} judges rank A, B, AB`);
    const judgePromises = Array.from({ length: numJudges }, (_, i) =>
      getJudgeRanking(client, model, opts.task, versionA, versionB, versionAB).then(
        (r) => {
          emit({
            type: "judge_vote",
            pass,
            judge: i,
            ranking: r.ranking,
            reason: r.reason,
          });
          return r.ranking;
        },
      ),
    );
    const rankings = await Promise.all(judgePromises);

    const borda = bordaCount(rankings);
    const w = winner(borda);
    emit({ type: "pass_winner", pass, winner: w, borda });

    const candidates: Record<Role, string> = {
      A: versionA,
      B: versionB,
      AB: versionAB,
    };
    lastFinal = candidates[w];

    if (w === "A") {
      aWinStreak += 1;
      if (aWinStreak >= 2) {
        emit({ type: "converged", pass, final: lastFinal });
        return;
      }
    } else {
      aWinStreak = 0;
      versionA = candidates[w];
    }
  }

  emit({ type: "max_passes_reached", pass: maxPasses, final: lastFinal });
}

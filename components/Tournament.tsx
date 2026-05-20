"use client";

import { useCallback, useRef, useState } from "react";
import type { Phase, Role, StreamEvent } from "@/lib/types";

interface PassState {
  pass: number;
  phases: Partial<Record<Phase, { label: string; text: string; streaming: boolean; done: boolean }>>;
  votes: { judge: number; ranking: Role[]; reason: string }[];
  borda?: Record<Role, number>;
  winner?: Role;
}

const PHASE_LABELS: Record<Phase, string> = {
  author: "Author",
  critic: "Critic",
  authorB: "Reviser",
  synth: "Synthesizer",
  judges: "Judges",
  decided: "Decided",
  converged: "Converged",
  max_passes: "Max passes",
};

const PHASE_TO_CARD: Partial<Record<Phase, Role | "critic">> = {
  author: "A",
  critic: "critic",
  authorB: "B",
  synth: "AB",
};

const PRESETS = [
  "Write a one-page memo proposing how a 50-person Series B SaaS company should handle the move from a remote-first to hybrid work model. Be specific about the policy, the rollout, and what to do about employees who can't relocate.",
  "Draft a tight 300-word product update announcing a new feature: real-time collaboration in a code editor. Audience: existing power users. Avoid marketing fluff; show the technical substance.",
  "Outline a 4-week onboarding plan for a senior backend engineer joining a payments team. Concrete weekly milestones, not generic 'meet the team' filler.",
];

export default function Tournament() {
  const [task, setTask] = useState("");
  const [maxPasses, setMaxPasses] = useState(3);
  const [numJudges, setNumJudges] = useState(3);
  const [running, setRunning] = useState(false);
  const [passes, setPasses] = useState<PassState[]>([]);
  const [terminal, setTerminal] = useState<{ kind: "converged" | "max_passes" | "error"; pass?: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applyEvent = useCallback((ev: StreamEvent) => {
    setPasses((prev) => {
      const next = [...prev];
      const idx = "pass" in ev ? next.findIndex((p) => p.pass === ev.pass) : -1;
      const ensure = (passNum: number) => {
        let i = next.findIndex((p) => p.pass === passNum);
        if (i === -1) {
          next.push({ pass: passNum, phases: {}, votes: [] });
          i = next.length - 1;
        }
        return i;
      };
      switch (ev.type) {
        case "pass_start": {
          ensure(ev.pass);
          break;
        }
        case "phase_start": {
          const i = ensure(ev.pass);
          next[i] = {
            ...next[i],
            phases: {
              ...next[i].phases,
              [ev.phase]: { label: ev.label, text: "", streaming: true, done: false },
            },
          };
          break;
        }
        case "token": {
          if (idx === -1) break;
          const cur = next[idx].phases[ev.phase];
          if (!cur) break;
          next[idx] = {
            ...next[idx],
            phases: {
              ...next[idx].phases,
              [ev.phase]: { ...cur, text: cur.text + ev.text, streaming: true },
            },
          };
          break;
        }
        case "phase_done": {
          if (idx === -1) break;
          const cur = next[idx].phases[ev.phase];
          if (!cur) break;
          next[idx] = {
            ...next[idx],
            phases: {
              ...next[idx].phases,
              [ev.phase]: { ...cur, text: ev.content, streaming: false, done: true },
            },
          };
          break;
        }
        case "judge_vote": {
          if (idx === -1) break;
          next[idx] = {
            ...next[idx],
            votes: [...next[idx].votes, { judge: ev.judge, ranking: ev.ranking, reason: ev.reason }],
          };
          break;
        }
        case "pass_winner": {
          if (idx === -1) break;
          next[idx] = { ...next[idx], winner: ev.winner, borda: ev.borda };
          break;
        }
      }
      return next;
    });
    if (ev.type === "converged") {
      setTerminal({ kind: "converged", pass: ev.pass, text: ev.final });
    } else if (ev.type === "max_passes_reached") {
      setTerminal({ kind: "max_passes", pass: ev.pass, text: ev.final });
    } else if (ev.type === "error") {
      setTerminal({ kind: "error", text: ev.message });
      setError(ev.message);
    }
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    const trimmed = task.trim();
    if (trimmed.length < 8) {
      setError("Give it at least a sentence.");
      return;
    }
    setError(null);
    setTerminal(null);
    setPasses([]);
    setRunning(true);

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: trimmed, maxPasses, numJudges }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(errBody.error ?? `HTTP ${res.status}`);
        setRunning(false);
        return;
      }
      if (!res.body) {
        setError("No response stream.");
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const json = line.slice("data: ".length);
          try {
            const ev = JSON.parse(json) as StreamEvent;
            applyEvent(ev);
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch (e) {
      if ((e as { name?: string }).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "stream failed");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [task, maxPasses, numJudges, running, applyEvent]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  return (
    <div className="w-full">
      {/* Input panel */}
      <div className="rule-thick border-b border-ink">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-ink">
            <div className="eyebrow mb-3">Task / 01</div>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="A well-specified, opinionated writing or planning task. The more concrete, the better."
              rows={5}
              disabled={running}
              className="w-full mono text-sm leading-relaxed bg-transparent border border-ink p-3 outline-none resize-none focus:bg-[rgba(0,0,0,0.03)] disabled:opacity-50"
              maxLength={4000}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={running}
                  onClick={() => setTask(p)}
                  className="eyebrow border border-ink px-2 py-1 hover:bg-ink hover:text-bg transition-colors disabled:opacity-30"
                >
                  Preset {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="eyebrow mb-3">Config / 02</div>
            <label className="block mb-4">
              <div className="mono text-xs mb-1">max passes: {maxPasses}</div>
              <input
                type="range"
                min={1}
                max={5}
                value={maxPasses}
                disabled={running}
                onChange={(e) => setMaxPasses(parseInt(e.target.value, 10))}
                className="w-full accent-black"
              />
            </label>
            <label className="block mb-6">
              <div className="mono text-xs mb-1">judges: {numJudges}</div>
              <input
                type="range"
                min={1}
                max={5}
                value={numJudges}
                disabled={running}
                onChange={(e) => setNumJudges(parseInt(e.target.value, 10))}
                className="w-full accent-black"
              />
            </label>
            {!running ? (
              <button
                type="button"
                onClick={run}
                className="display w-full text-2xl bg-ink text-bg py-4 hover:bg-hl hover:text-ink transition-colors"
              >
                Run tournament
              </button>
            ) : (
              <button
                type="button"
                onClick={stop}
                className="display w-full text-2xl bg-hl text-ink py-4 border border-ink"
              >
                Stop
              </button>
            )}
            {error && (
              <div className="mt-4 mono text-xs border border-ink p-2 bg-hl">{error}</div>
            )}
          </div>
        </div>
      </div>

      {/* Live tournament */}
      {passes.length > 0 && (
        <div className="p-6 md:p-10 border-b border-ink">
          <div className="eyebrow mb-6">Live tournament / 03</div>
          <div className="space-y-12">
            {passes.map((p) => (
              <PassBlock key={p.pass} pass={p} totalJudges={numJudges} />
            ))}
          </div>
        </div>
      )}

      {/* Terminal verdict */}
      {terminal && (
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-3">
            {terminal.kind === "converged" && "Converged / 04"}
            {terminal.kind === "max_passes" && "Max passes reached / 04"}
            {terminal.kind === "error" && "Error / 04"}
          </div>
          <div className="display text-4xl md:text-6xl mb-6">
            {terminal.kind === "converged" && "A held."}
            {terminal.kind === "max_passes" && "Tap out."}
            {terminal.kind === "error" && "Broke."}
          </div>
          {terminal.kind !== "error" && (
            <div className="card mono text-sm whitespace-pre-wrap">{terminal.text}</div>
          )}
          {terminal.kind === "error" && (
            <div className="mono text-sm border border-ink p-3 bg-hl">{terminal.text}</div>
          )}
        </div>
      )}
    </div>
  );
}

function PassBlock({ pass, totalJudges }: { pass: PassState; totalJudges: number }) {
  const critic = pass.phases.critic;
  const a = pass.phases.author;
  const b = pass.phases.authorB;
  const ab = pass.phases.synth;
  const winnerSet: Role | null = pass.winner ?? null;

  return (
    <div>
      <div className="flex items-baseline gap-4 mb-4">
        <div className="display text-5xl md:text-6xl">P{String(pass.pass).padStart(2, "0")}</div>
        <div className="eyebrow">
          {a ? "author • " : ""}critic → reviser → synthesizer → {totalJudges} judges
        </div>
      </div>

      {a && (
        <div className="mb-4">
          <Card label="A — drafted" tag="A" content={a.text} streaming={a.streaming} done={a.done} />
        </div>
      )}

      {critic && (
        <div className="mb-4">
          <Card
            label="critique"
            tag="CRIT"
            content={critic.text}
            streaming={critic.streaming}
            done={critic.done}
            faded
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {b && (
          <Card
            label="B — revised"
            tag="B"
            content={b.text}
            streaming={b.streaming}
            done={b.done}
            winner={winnerSet === "B"}
          />
        )}
        {ab && (
          <Card
            label="AB — synthesis"
            tag="AB"
            content={ab.text}
            streaming={ab.streaming}
            done={ab.done}
            winner={winnerSet === "AB"}
          />
        )}
      </div>

      {pass.votes.length > 0 && (
        <div className="mt-6">
          <div className="eyebrow mb-3">
            judge panel — {pass.votes.length} / {totalJudges}
            {pass.votes.length < totalJudges && <span className="ml-2 spinner-bar align-baseline" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pass.votes.map((v) => (
              <div key={v.judge} className="border border-ink p-3">
                <div className="mono text-xs flex items-center gap-2 mb-2">
                  <span>J{v.judge + 1}</span>
                  <span className="opacity-50">|</span>
                  <span>
                    {v.ranking.map((r, idx) => (
                      <span key={idx}>
                        {idx > 0 && " > "}
                        <span className={r === winnerSet ? "underline" : ""}>{r}</span>
                      </span>
                    ))}
                  </span>
                </div>
                {v.reason && <div className="mono text-xs opacity-70 leading-snug">{v.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {pass.borda && pass.winner && (
        <div className="mt-6 border-t border-ink pt-4">
          <div className="eyebrow mb-3">borda count</div>
          <div className="grid grid-cols-3 gap-4">
            {(["A", "B", "AB"] as Role[]).map((r) => {
              const score = pass.borda![r];
              const max = Math.max(...Object.values(pass.borda!));
              const pct = max === 0 ? 0 : (score / max) * 100;
              return (
                <div key={r}>
                  <div className="mono text-xs flex justify-between mb-1">
                    <span className={r === pass.winner ? "font-bold" : ""}>{r}</span>
                    <span>{score}</span>
                  </div>
                  <div className="vote-bar" style={{ width: `${pct}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-3 mono text-xs">
            winner: <span className="bg-ink text-bg px-1.5 py-0.5">{pass.winner}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  tag,
  content,
  streaming,
  done,
  winner,
  faded,
}: {
  label: string;
  tag: string;
  content: string;
  streaming: boolean;
  done: boolean;
  winner?: boolean;
  faded?: boolean;
}) {
  return (
    <div className={`card ${winner ? "card-winner" : ""} ${faded ? "opacity-80" : ""}`}>
      <span className="card-tag">{tag}</span>
      <div className="mt-2 whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
        {content}
        {streaming && !done && <span className="token-cursor" />}
        {!content && !done && (
          <span className="opacity-50">
            <span className="spinner-bar" /> generating…
          </span>
        )}
      </div>
      <div className="eyebrow mt-3 opacity-60">{label}</div>
    </div>
  );
}

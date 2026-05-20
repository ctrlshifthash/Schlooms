"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase, Role, StreamEvent } from "@/lib/types";
import { HermesMark } from "@/components/HermesMark";

interface PhaseSlot {
  label: string;
  text: string;
  streaming: boolean;
  done: boolean;
}

interface PassState {
  pass: number;
  phases: Partial<Record<Phase, PhaseSlot>>;
  votes: { judge: number; ranking: Role[]; reason: string }[];
  borda?: Record<Role, number>;
  winner?: Role;
}

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

const PRESETS = [
  {
    title: "Hybrid work memo",
    text: "Write a one-page memo proposing how a 50-person Series B SaaS company should handle the move from a remote-first to hybrid work model. Be specific about the policy, the rollout, and what to do about employees who can't relocate.",
  },
  {
    title: "Realtime collab launch",
    text: "Draft a tight 300-word product update announcing a new feature: real-time collaboration in a code editor. Audience: existing power users. Avoid marketing fluff; show the technical substance.",
  },
  {
    title: "Senior eng onboarding",
    text: "Outline a 4-week onboarding plan for a senior backend engineer joining a payments team. Concrete weekly milestones, not generic 'meet the team' filler.",
  },
];

export default function Tournament() {
  const [task, setTask] = useState("");
  const [maxPasses, setMaxPasses] = useState(3);
  const [numJudges, setNumJudges] = useState(3);
  const [running, setRunning] = useState(false);
  const [passes, setPasses] = useState<PassState[]>([]);
  const [terminal, setTerminal] = useState<
    | { kind: "converged" | "max_passes" | "error"; pass?: number; text: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [running]);

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
            votes: [
              ...next[idx].votes,
              { judge: ev.judge, ranking: ev.ranking, reason: ev.reason },
            ],
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
    if (ev.type === "converged") setTerminal({ kind: "converged", pass: ev.pass, text: ev.final });
    else if (ev.type === "max_passes_reached")
      setTerminal({ kind: "max_passes", pass: ev.pass, text: ev.final });
    else if (ev.type === "error") {
      setTerminal({ kind: "error", text: ev.message });
      setError(ev.message);
    }
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    const trimmed = task.trim();
    if (trimmed.length < 8) {
      setError("Task needs at least a sentence.");
      return;
    }
    setError(null);
    setTerminal(null);
    setPasses([]);
    setStartedAt(Date.now());
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
          try {
            const ev = JSON.parse(line.slice("data: ".length)) as StreamEvent;
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

  const elapsedSec =
    startedAt && (running || terminal)
      ? Math.floor((Date.now() - startedAt) / 1000)
      : 0;
  void tick; // re-render trigger for elapsed counter

  const allPhases = passes.flatMap((p) => Object.values(p.phases));
  const doneCount = allPhases.filter((p) => p?.done).length;
  const phaseProgress =
    allPhases.length > 0 ? Math.min((doneCount / allPhases.length) * 100, 100) : 0;

  return (
    <div className="w-full">
      {/* Run controls */}
      <section className="px-6 md:px-12 py-12 border-b border-panel-edge">
        <div className="flex items-end justify-between mb-6">
          <div className="section-head">RUN CONTROLS · II</div>
          <span className="eyebrow">fig. II</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-px bg-panel-edge border border-panel-edge">
          {/* Task input */}
          <div className="bg-panel p-5 md:p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow eyebrow-copper flex items-center gap-2">
                <span className="text-copper">
                  <HermesMark size={12} />
                </span>
                task definition
              </div>
              <div className="eyebrow">{task.length} / 4000</div>
            </div>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="A concrete, opinionated writing or planning task. The more specific the constraints, the better the tournament differentiates A / B / AB."
              rows={6}
              disabled={running}
              maxLength={4000}
              className="w-full mono text-[13px] leading-relaxed p-3 outline-none resize-none disabled:opacity-50"
            />
            <div className="mt-4">
              <div className="eyebrow mb-2">presets</div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={running}
                    onClick={() => setTask(p.text)}
                    className="btn-ghost"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Config + launch */}
          <div className="bg-panel p-5 md:p-6 relative">
            <div className="eyebrow eyebrow-copper mb-4">configuration</div>

            <div className="space-y-5 mb-6">
              <div>
                <div className="flex justify-between mono text-[11px] uppercase tracking-[0.18em] text-fg-dim mb-1.5">
                  <span>max passes</span>
                  <span className="text-copper">{maxPasses}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={maxPasses}
                  disabled={running}
                  onChange={(e) => setMaxPasses(parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <div className="flex justify-between mono text-[11px] uppercase tracking-[0.18em] text-fg-dim mb-1.5">
                  <span>judges</span>
                  <span className="text-copper">{numJudges}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={numJudges}
                  disabled={running}
                  onChange={(e) => setNumJudges(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            {!running ? (
              <button
                type="button"
                onClick={run}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <span className="opacity-80">
                  <HermesMark size={14} glow={false} />
                </span>
                Dispatch tournament
              </button>
            ) : (
              <button type="button" onClick={stop} className="btn-stop w-full">
                ■ Abort
              </button>
            )}

            {error && (
              <div className="mt-4 mono text-[11px] border border-crimson/60 bg-crimson/10 text-crimson p-2.5">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Live status strip */}
        {(running || passes.length > 0 || terminal) && (
          <div className="mt-5 panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span
                  className={`led ${
                    running
                      ? "led-phosphor"
                      : terminal?.kind === "converged"
                      ? "led-good"
                      : terminal?.kind === "error"
                      ? "led-crimson"
                      : "led-copper"
                  }`}
                />
                <span className="text-copper">
                  {running
                    ? "tournament running"
                    : terminal?.kind === "converged"
                    ? "converged"
                    : terminal?.kind === "max_passes"
                    ? "max passes reached"
                    : terminal?.kind === "error"
                    ? "error"
                    : "idle"}
                </span>
              </div>
              <div className="flex items-center gap-6 text-fg-dim">
                <span>
                  passes — <span className="text-fg">{passes.length}</span> /{" "}
                  {maxPasses}
                </span>
                <span>
                  phases — <span className="text-fg">{doneCount}</span> /{" "}
                  {allPhases.length || "—"}
                </span>
                <span>
                  elapsed — <span className="text-fg">{elapsedSec}s</span>
                </span>
              </div>
            </div>
            <div className="px-3.5 py-3">
              <div className="gauge-track">
                <div
                  className="gauge-fill"
                  style={{
                    width: `${
                      passes.length > 0 ? phaseProgress : running ? 3 : 0
                    }%`,
                  }}
                />
                <div className="gauge-ticks" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Live tournament */}
      {passes.length > 0 && (
        <section className="px-6 md:px-12 py-14 border-b border-panel-edge">
          <div className="flex items-end justify-between mb-7">
            <div className="section-head">LIVE TOURNAMENT · III</div>
            <span className="eyebrow">fig. III</span>
          </div>
          <div className="space-y-10">
            {passes.map((p) => (
              <PassBlock key={p.pass} pass={p} totalJudges={numJudges} />
            ))}
          </div>
        </section>
      )}

      {/* Terminal verdict */}
      {terminal && (
        <section className="px-6 md:px-12 py-14 fade-up">
          <div className="flex items-end justify-between mb-6">
            <div className="section-head">
              {terminal.kind === "converged" && "VERDICT · CONVERGED"}
              {terminal.kind === "max_passes" && "VERDICT · MAX PASSES"}
              {terminal.kind === "error" && "VERDICT · ERROR"}
            </div>
            <span className="eyebrow">fig. IV</span>
          </div>

          <div className="flex items-center gap-4 mb-7">
            <span
              className={`led ${
                terminal.kind === "converged"
                  ? "led-good"
                  : terminal.kind === "error"
                  ? "led-crimson"
                  : "led-copper"
              }`}
            />
            <h2 className="wordmark text-4xl md:text-5xl">
              {terminal.kind === "converged" && (
                <span className="text-gold copper-glow-text">
                  A held twice. Loop converged.
                </span>
              )}
              {terminal.kind === "max_passes" && (
                <span className="text-fg">
                  Pass cap reached. Final winner archived.
                </span>
              )}
              {terminal.kind === "error" && (
                <span className="text-crimson">Run failed.</span>
              )}
            </h2>
          </div>

          {terminal.kind !== "error" ? (
            <div className="panel tick-corners">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <span className="text-copper">
                    <HermesMark size={14} />
                  </span>
                  <span className="text-copper">final artifact</span>
                </div>
                <div>pass {terminal.pass}</div>
              </div>
              <div className="panel-body mono text-[13px] leading-relaxed whitespace-pre-wrap">
                {terminal.text}
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <span className="led led-crimson" />
                  <span className="text-crimson">error trace</span>
                </div>
              </div>
              <div className="panel-body mono text-[12px] text-crimson whitespace-pre-wrap">
                {terminal.text}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PassBlock({ pass, totalJudges }: { pass: PassState; totalJudges: number }) {
  const a = pass.phases.author;
  const critic = pass.phases.critic;
  const b = pass.phases.authorB;
  const ab = pass.phases.synth;
  const winnerSet: Role | null = pass.winner ?? null;
  const passDone = !!pass.winner;
  const passActive = !passDone && Object.values(pass.phases).some((p) => p?.streaming);

  return (
    <div className="panel tick-corners fade-up">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <span
            className={`led ${
              passDone ? "led-good" : passActive ? "led-phosphor" : "led-copper"
            }`}
          />
          <span className="roman text-copper text-base">
            PASS {ROMAN[pass.pass] ?? pass.pass}
          </span>
          <span className="text-fg-faint">
            · author → critic → reviser → synthesizer → {totalJudges} judges
          </span>
        </div>
        {pass.winner && (
          <div className="flex items-center gap-2">
            <span className="text-fg-faint">winner</span>
            <span className="text-gold font-bold">{pass.winner}</span>
          </div>
        )}
      </div>

      <div className="panel-body space-y-4">
        {a && (
          <TCard tag="A" label="incumbent draft" slot={a} winner={winnerSet === "A"} />
        )}

        {critic && <TCard tag="CRIT" label="critic findings" slot={critic} faded />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {b && (
            <TCard
              tag="B"
              label="revised by critique"
              slot={b}
              winner={winnerSet === "B"}
            />
          )}
          {ab && (
            <TCard
              tag="AB"
              label="synthesis of A + B"
              slot={ab}
              winner={winnerSet === "AB"}
            />
          )}
        </div>

        {pass.votes.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-3 mb-3">
              <span className="eyebrow eyebrow-copper">judge panel</span>
              <span className="mono text-[11px] text-fg-dim flex items-center gap-2">
                {pass.votes.length} / {totalJudges}
                {pass.votes.length < totalJudges && <span className="led led-phosphor" />}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pass.votes.map((v) => (
                <div
                  key={v.judge}
                  className="border border-panel-edge bg-bg-2 p-3 fade-up"
                >
                  <div className="flex items-center gap-2 mono text-[11px] mb-2">
                    <span className="text-copper">J{v.judge + 1}</span>
                    <span className="text-fg-faint">·</span>
                    <span className="text-fg">
                      {v.ranking.map((r, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="text-fg-faint"> › </span>}
                          <span
                            className={
                              r === winnerSet ? "text-gold font-bold" : ""
                            }
                          >
                            {r}
                          </span>
                        </span>
                      ))}
                    </span>
                  </div>
                  {v.reason && (
                    <div className="mono text-[11px] text-fg-dim leading-snug">
                      {v.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pass.borda && pass.winner && (
          <div className="mt-5 border-t border-panel-edge pt-5">
            <div className="eyebrow eyebrow-copper mb-3">borda count</div>
            <div className="grid grid-cols-3 gap-4">
              {(["A", "B", "AB"] as Role[]).map((r) => {
                const score = pass.borda![r];
                const max = Math.max(...Object.values(pass.borda!));
                const pct = max === 0 ? 0 : (score / max) * 100;
                const isWinner = r === pass.winner;
                return (
                  <div key={r}>
                    <div className="flex justify-between mono text-[11px] mb-1.5">
                      <span className={isWinner ? "text-gold" : "text-fg-dim"}>{r}</span>
                      <span className={isWinner ? "text-gold" : "text-fg"}>{score}</span>
                    </div>
                    <div className="gauge-track">
                      <div
                        className={`gauge-fill ${isWinner ? "" : "gauge-fill-dim"}`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="gauge-ticks" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TCard({
  tag,
  label,
  slot,
  winner,
  faded,
}: {
  tag: "A" | "B" | "AB" | "CRIT";
  label: string;
  slot: PhaseSlot;
  winner?: boolean;
  faded?: boolean;
}) {
  return (
    <div className={`tcard ${winner ? "tcard-winner" : ""} ${faded ? "opacity-90" : ""}`}>
      <div className="tcard-head">
        <div className="flex items-center gap-2">
          <span className={`tcard-tag-${tag}`}>{tag}</span>
          <span className="text-fg-faint normal-case tracking-normal">/ {label}</span>
        </div>
        <div className="flex items-center gap-2">
          {slot.streaming && !slot.done && (
            <>
              <span className="led led-phosphor" />
              <span className="text-phosphor">streaming</span>
            </>
          )}
          {slot.done && (
            <>
              <span className="led led-good" />
              <span className="text-gold">done</span>
            </>
          )}
          {winner && <span className="text-gold ml-2">★ winner</span>}
        </div>
      </div>
      <div className="tcard-body">
        {slot.text || (
          <span className="text-fg-faint flex items-center gap-2">
            <span className="led led-phosphor" /> generating…
          </span>
        )}
        {slot.streaming && !slot.done && <span className="token-cursor" />}
      </div>
    </div>
  );
}

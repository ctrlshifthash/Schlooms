import Tournament from "@/components/Tournament";

export default function Home() {
  return (
    <main className="mx-auto max-w-[1200px] border-l border-r border-ink min-h-screen">
      {/* Masthead */}
      <header className="border-b border-ink p-6 md:p-10">
        <div className="flex items-baseline justify-between mb-4">
          <div className="eyebrow">Schlooms — autoreason live demo</div>
          <div className="eyebrow">VOL 01 / ISSUE 01</div>
        </div>
        <h1 className="display text-[clamp(3rem,12vw,9rem)]">
          Self-refinement
          <br />
          that knows
          <br />
          when to stop.
        </h1>
        <p className="mt-6 mono text-sm max-w-2xl leading-relaxed">
          Most &quot;make this better&quot; loops degrade weak outputs and never converge.
          Autoreason runs a three-way tournament every pass — keep the original (A),
          generate an adversarial revision (B), and a synthesis (AB) — judged
          blindly by a fresh panel. &quot;Do nothing&quot; is always on the ballot.
          Watch it run, live, on a task you choose.
        </p>
      </header>

      {/* The loop, as a diagram */}
      <section className="border-b border-ink p-6 md:p-10">
        <div className="eyebrow mb-4">How one pass works / 00</div>
        <pre className="mono text-xs leading-[1.4] whitespace-pre overflow-x-auto">
{`   ┌──────────────┐
   │ INCUMBENT A  │ (kept verbatim)
   └──────┬───────┘
          │
          ├──► CRITIC ────────────────────► flaws (no fixes)
          │                                      │
          │                                      ▼
          ├──► AUTHOR-B ──────────────────► REVISION  B
          │
          └──► SYNTHESIZER (A + B) ───────► SYNTHESIS AB

                              ▼
                ┌─────────────────────────┐
                │ JUDGE PANEL × N         │  fresh agents,
                │ blind Borda count       │  no shared context
                └────────────┬────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                A wins twice in a    winner ≠ A
                row → CONVERGED       → A := winner, loop`}
        </pre>
      </section>

      <Tournament />

      {/* Footer */}
      <footer className="border-t border-ink p-6 md:p-10 mono text-xs flex flex-wrap gap-x-8 gap-y-3 justify-between">
        <div>
          method:{" "}
          <a
            href="https://github.com/NousResearch/autoreason"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            NousResearch/autoreason
          </a>{" "}
          (SHL0MS · Hermes Agent)
        </div>
        <div>
          model: claude-sonnet-4-6 · prompts lifted verbatim from the paper&apos;s runner
        </div>
        <div>this site bundles the inference; the research is not ours</div>
      </footer>
    </main>
  );
}

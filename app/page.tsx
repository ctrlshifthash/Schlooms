import Tournament from "@/components/Tournament";
import { HermesMark, HermesWing } from "@/components/HermesMark";

export default function Home() {
  return (
    <main className="dossier-bg min-h-screen relative overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-[1320px]">
        {/* Sticky status bar */}
        <div className="statusbar sticky top-0 z-30">
          <div className="flex items-center justify-between px-5 py-2.5 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-copper">
                <HermesMark size={20} />
              </span>
              <span className="mono text-[11px] tracking-[0.24em] uppercase text-copper">
                Hermes Agent
              </span>
              <span className="mono text-[10px] text-fg-faint">/ Schlooms · v0.1</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap mono text-[10px] tracking-[0.18em] uppercase text-fg-dim">
              <span className="meta-pill">
                <span className="led led-copper" /> ONLINE
              </span>
              <span className="meta-pill">
                <span className="text-fg-faint">M—</span>
                <span className="text-fg">claude-sonnet-4-6</span>
              </span>
              <a
                href="https://github.com/NousResearch/autoreason"
                target="_blank"
                rel="noreferrer"
                className="meta-pill hover:text-copper-bright"
              >
                <span className="text-fg-faint">METHOD—</span>
                <span className="text-copper">autoreason</span>
              </a>
            </div>
          </div>
          <div className="copper-rule" />
        </div>

        {/* Masthead */}
        <header className="px-6 md:px-12 pt-12 md:pt-20 pb-16 border-b border-panel-edge relative">
          {/* Background watermark caduceus */}
          <div className="caduceus-bg right-[-40px] top-10 hidden md:block">
            <HermesMark size={520} glow={false} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-7">
              <span className="hermes-stamp">
                <span className="text-copper">
                  <HermesMark size={14} glow={false} />
                </span>
                HERMES AGENT · DOSSIER 01
              </span>
              <span className="meta-pill">
                <span className="led led-copper" />
                LIVE
              </span>
              <span className="meta-pill hidden md:inline-flex">
                CLASSIFICATION · OPEN
              </span>
            </div>

            <h1 className="wordmark text-[clamp(2.6rem,8.5vw,6.4rem)] text-fg">
              Self-refinement
              <br />
              <span className="text-copper copper-glow-text">
                that knows when to stop.
              </span>
            </h1>

            <div className="mt-6 flex items-center gap-3 max-w-md text-copper">
              <HermesWing size={70} />
              <span className="mono text-[11px] tracking-[0.24em] uppercase text-fg-dim">
                a live harness for the autoreason method
              </span>
              <HermesWing size={70} flip />
            </div>

            <p className="mt-9 mono text-[13px] leading-relaxed text-fg-dim max-w-3xl">
              <span className="text-copper-bright">SHL0MS</span> · {" "}
              <span className="text-copper-bright">HERMES AGENT</span> — Nous
              Research. Iterative self-refinement fails for three structural
              reasons:{" "}
              <span className="text-fg">prompt bias</span> (models hallucinate
              flaws when asked to critique),{" "}
              <span className="text-fg">scope creep</span> (outputs expand
              unchecked each pass), and{" "}
              <span className="text-fg">lack of restraint</span> (models never
              say &ldquo;no changes needed&rdquo;). Autoreason fixes all three.
              Author drafts <span className="text-fg">A</span> → critic finds
              flaws → reviser writes <span className="text-fg">B</span> →
              synthesizer fuses <span className="text-fg">A</span> and{" "}
              <span className="text-fg">B</span> → an{" "}
              <span className="text-fg">N-judge blind Borda panel</span> picks
              the winner. When <span className="text-fg">A</span> wins twice in
              a row, the loop converges.
            </p>

            {/* Headline metrics — gives the masthead dashboard weight. */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-panel-edge border border-panel-edge">
              <Stat label="passes / max" value="≤ 5" />
              <Stat label="judge panel" value="3–7" />
              <Stat label="convergence" value="A wins 2×" />
              <Stat label="latency" value="streamed" accent />
            </div>
          </div>
        </header>

        {/* Pipeline diagram, panelised */}
        <section className="border-b border-panel-edge px-6 md:px-12 py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="section-head">PIPELINE · ONE PASS</div>
            <span className="eyebrow">fig. I</span>
          </div>
          <div className="panel tick-corners">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="text-copper">
                  <HermesMark size={14} />
                </span>
                <span>tournament loop</span>
              </div>
              <span>fresh agents, no shared context</span>
            </div>
            <div className="panel-body grid-blueprint">
              <PipelineDiagram />
            </div>
          </div>
        </section>

        <Tournament />

        {/* Footer */}
        <footer className="border-t border-panel-edge px-6 md:px-12 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="seal">
                <HermesMark size={30} glow={false} />
              </div>
              <div>
                <div className="wordmark text-2xl text-copper">HERMES AGENT</div>
                <div className="mono text-[11px] text-fg-dim tracking-[0.18em] uppercase">
                  Schlooms · autoreason console
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mono text-[11px] text-fg-dim">
              <div>
                <span className="text-fg-faint">method · </span>
                <a
                  href="https://github.com/NousResearch/autoreason"
                  target="_blank"
                  rel="noreferrer"
                  className="text-copper hover:text-copper-bright underline underline-offset-2"
                >
                  NousResearch/autoreason
                </a>
              </div>
              <div>
                <span className="text-fg-faint">authors · </span>
                <span className="text-fg">SHL0MS · Hermes Agent</span>
              </div>
              <div>
                <span className="text-fg-faint">inference · </span>
                <span className="text-fg">Anthropic API, streamed</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-bg px-4 py-5 relative overflow-hidden">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className={`mono text-2xl font-bold ${
          accent ? "text-phosphor" : "text-fg"
        }`}
      >
        {value}
      </div>
      <div className="absolute right-2 top-2 opacity-15 text-copper">
        <HermesMark size={36} glow={false} />
      </div>
    </div>
  );
}

function PipelineDiagram() {
  // Inline SVG pipeline — looks substantially more polished than ASCII art.
  return (
    <svg
      viewBox="0 0 880 360"
      className="w-full h-auto"
      role="img"
      aria-label="Autoreason pipeline — one pass"
    >
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--copper)" />
        </marker>
        <linearGradient id="boxFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.0)" />
        </linearGradient>
      </defs>

      {/* INCUMBENT A */}
      <g>
        <rect x="20" y="20" width="200" height="56" fill="url(#boxFill)" stroke="var(--copper)" strokeWidth="1" />
        <text x="120" y="46" textAnchor="middle" fill="var(--copper)" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3">INCUMBENT A</text>
        <text x="120" y="64" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">kept verbatim · &ldquo;do nothing&rdquo; ballot</text>
      </g>

      {/* Branch arrows from A */}
      <path d="M120 76 L120 124" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />

      {/* Trunk down */}
      <path d="M120 124 L120 320" stroke="var(--copper)" strokeWidth="1" fill="none" opacity="0.5" />

      {/* CRITIC */}
      <g>
        <path d="M120 140 L300 140" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />
        <rect x="310" y="118" width="170" height="46" fill="url(#boxFill)" stroke="var(--copper)" strokeWidth="1" />
        <text x="395" y="139" textAnchor="middle" fill="var(--crimson)" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3">CRITIC</text>
        <text x="395" y="154" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">flaws only · no fixes</text>
      </g>

      {/* AUTHOR-B */}
      <g>
        <path d="M120 200 L300 200" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />
        <rect x="310" y="178" width="170" height="46" fill="url(#boxFill)" stroke="var(--copper)" strokeWidth="1" />
        <text x="395" y="199" textAnchor="middle" fill="var(--phosphor)" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3">AUTHOR-B</text>
        <text x="395" y="214" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">revises against critique</text>
      </g>

      {/* SYNTHESIZER */}
      <g>
        <path d="M120 260 L300 260" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />
        <rect x="310" y="238" width="170" height="46" fill="url(#boxFill)" stroke="var(--copper)" strokeWidth="1" />
        <text x="395" y="259" textAnchor="middle" fill="var(--copper)" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3">SYNTHESIZER</text>
        <text x="395" y="274" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">A + B → AB</text>
      </g>

      {/* Outputs feeding judges */}
      <path d="M480 141 L600 141 L600 178" stroke="var(--copper)" strokeWidth="1" fill="none" />
      <path d="M480 201 L600 201" stroke="var(--copper)" strokeWidth="1" fill="none" />
      <path d="M480 261 L600 261 L600 224" stroke="var(--copper)" strokeWidth="1" fill="none" />
      <path d="M600 201 L640 201" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />

      {/* JUDGES */}
      <g>
        <rect x="650" y="160" width="200" height="82" fill="url(#boxFill)" stroke="var(--gold)" strokeWidth="1.4" />
        <text x="750" y="185" textAnchor="middle" fill="var(--gold)" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="3">JUDGE PANEL × N</text>
        <text x="750" y="203" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">fresh agents</text>
        <text x="750" y="217" textAnchor="middle" fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize="9">no shared context</text>
        <text x="750" y="232" textAnchor="middle" fill="var(--copper-bright)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2">BLIND BORDA</text>
      </g>

      {/* Outcome branches */}
      <path d="M750 242 L750 290" stroke="var(--copper)" strokeWidth="1" fill="none" markerEnd="url(#arr)" />
      <g>
        <rect x="540" y="296" width="200" height="42" fill="url(#boxFill)" stroke="var(--gold)" strokeWidth="1" />
        <text x="640" y="320" textAnchor="middle" fill="var(--gold)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2">A WINS 2× → CONVERGED</text>
      </g>
      <g>
        <rect x="760" y="296" width="100" height="42" fill="url(#boxFill)" stroke="var(--copper)" strokeWidth="1" />
        <text x="810" y="320" textAnchor="middle" fill="var(--copper)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2">A := WINNER</text>
      </g>
      <path d="M740 290 L640 290 L640 296" stroke="var(--copper)" strokeWidth="1" fill="none" />
      <path d="M760 290 L810 290 L810 296" stroke="var(--copper)" strokeWidth="1" fill="none" />
    </svg>
  );
}

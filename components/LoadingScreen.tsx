"use client";

import { useEffect, useState } from "react";

const STATUS_LINES = [
  "Initializing tournament harness",
  "Loading critic prompts",
  "Assembling A, B, AB",
  "Calibrating blind judge panel",
  "Ready",
];

const HOLD_MS = 3600;
const FADE_MS = 700;

export default function LoadingScreen() {
  const [stage, setStage] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STATUS_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => setStage(i), (i + 1) * (HOLD_MS / (STATUS_LINES.length + 1))),
      );
    });
    timers.push(setTimeout(() => setExiting(true), HOLD_MS));
    timers.push(setTimeout(() => setHidden(true), HOLD_MS + FADE_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (hidden) return null;

  return (
    <div className={`cd-loader ${exiting ? "cd-loader-exit" : ""}`}>
      <div className="cd-loader-inner">
        <div className="cd-eyebrow">Autoreason · tournament harness</div>

        <div className="cd-caduceus">
          {/* Drawn-in caduceus — paths animate via stroke-dasharray */}
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <line x1="32" y1="6" x2="32" y2="58" strokeWidth="1.4" />
            <circle cx="32" cy="6" r="2.2" data-fill="1" />
            <path d="M32 14 C 24 12, 18 14, 12 18 C 18 17, 24 18, 30 22" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M32 14 C 40 12, 46 14, 52 18 C 46 17, 40 18, 34 22" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M32 18 C 26 17, 21 19, 17 22 C 22 21.5, 27 22, 31 25" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
            <path d="M32 18 C 38 17, 43 19, 47 22 C 42 21.5, 37 22, 33 25" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
            <path d="M32 22 C 22 28, 22 34, 32 38 C 42 42, 42 48, 32 54" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M32 22 C 42 28, 42 34, 32 38 C 22 42, 22 48, 32 54" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="22" cy="26" r="1.6" data-fill="1" />
            <circle cx="42" cy="26" r="1.6" data-fill="1" />
          </svg>
        </div>

        <h1 className="cd-wordmark" aria-label="Autoreason">
          {"Autoreason".split("").map((c, i) => (
            <span key={i} style={{ animationDelay: `${500 + i * 55}ms` }}>
              {c}
            </span>
          ))}
        </h1>

        <p className="cd-tagline">
          Self-refinement that <em>knows when to stop.</em>
        </p>

        {/* Mini animated tournament — nodes light up in autoreason order */}
        <div className="cd-prototype" aria-hidden="true">
          <div className={`cd-node ${stage >= 1 ? "cd-node-active" : ""}`}>A</div>
          <div className={`cd-node ${stage >= 2 ? "cd-node-active" : ""}`}>B</div>
          <div className={`cd-node ${stage >= 2 ? "cd-node-active" : ""}`}>AB</div>
          <div className={`cd-node ${stage >= 3 ? "cd-node-judges-active" : ""}`}>
            ★ Judges
          </div>
        </div>

        <div className="cd-progress">
          <div className="cd-progress-bar" />
        </div>

        <div className="cd-status">
          <span key={stage} className="cd-status-line">
            {STATUS_LINES[stage]}
            {stage < STATUS_LINES.length - 1 ? "…" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { HermesMark } from "@/components/HermesMark";

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
          <HermesMark size={84} glow={false} />
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

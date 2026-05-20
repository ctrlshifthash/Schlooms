// Brand mark — Autoreason logo. Same API as before (size/className/glow)
// so every caller (status bar, masthead stamp, footer seal, stat cards,
// loading screen) keeps working without changes.

export function HermesMark({
  className = "",
  size = 24,
  glow = true,
}: {
  className?: string;
  size?: number;
  glow?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/autoreason-mark.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "inline-block",
        ...(glow
          ? { filter: "drop-shadow(0 0 6px currentColor)" }
          : {}),
      }}
      aria-hidden="true"
    />
  );
}

// Stylized wing — used as decorative section dividers under the headline.
// Kept as SVG so it inherits text color and stays sharp at any size.
export function HermesWing({
  className = "",
  flip = false,
  size = 60,
}: {
  className?: string;
  flip?: boolean;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 60"
      width={size}
      height={size / 2}
      className={className}
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M2 30 C 20 28, 40 26, 60 28 C 80 30, 100 36, 118 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M2 30 C 22 24, 44 18, 68 18 C 88 18, 104 22, 118 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.8"
        strokeLinecap="round"
      />
      <path
        d="M2 30 C 24 18, 50 10, 76 8 C 94 7, 108 10, 118 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.55"
        strokeLinecap="round"
      />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i + 1) / 10;
        const x1 = 10 + t * 100;
        const y1 = 30 - t * 18;
        const y2 = 30 - t * 4;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.55"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}

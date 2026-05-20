// Caduceus + winged staff — the Hermes mark. Pure SVG so it scales,
// pulses on the system-status LED, and never depends on a font glyph.

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
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={glow ? { filter: "drop-shadow(0 0 6px currentColor)" } : undefined}
    >
      {/* Center staff */}
      <line x1="32" y1="6" x2="32" y2="58" stroke="currentColor" strokeWidth="1.4" />
      {/* Knob at top */}
      <circle cx="32" cy="6" r="2.2" fill="currentColor" />
      {/* Wings — flared, slightly angular */}
      <path
        d="M32 14 C 24 12, 18 14, 12 18 C 18 17, 24 18, 30 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M32 14 C 40 12, 46 14, 52 18 C 46 17, 40 18, 34 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M32 18 C 26 17, 21 19, 17 22 C 22 21.5, 27 22, 31 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M32 18 C 38 17, 43 19, 47 22 C 42 21.5, 37 22, 33 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Two intertwined snakes */}
      <path
        d="M32 22 C 22 28, 22 34, 32 38 C 42 42, 42 48, 32 54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 22 C 42 28, 42 34, 32 38 C 22 42, 22 48, 32 54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Snake heads */}
      <circle cx="22" cy="26" r="1.6" fill="currentColor" />
      <circle cx="42" cy="26" r="1.6" fill="currentColor" />
    </svg>
  );
}

// Stylized wing — used as section dividers and corner accents.
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
      {/* Feather ribs */}
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

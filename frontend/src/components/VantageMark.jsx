/**
 * The signature visual: a lens/aperture — concentric arcs converging on a
 * bright center point. Echoes "Vantage": a single vantage point that takes
 * in everything around it (text, voice, image, document, code).
 */
export default function VantageMark({ size = 24, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="var(--accent)" strokeWidth="1.3" opacity="0.35" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.3" opacity="0.6" />
      <path
        d="M12 2.5 A9.5 9.5 0 0 1 21.5 12"
        stroke="var(--accent-2)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill="var(--accent)">
        {animated && (
          <animate attributeName="r" values="3;3.7;3" dur="2.4s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="12" cy="12" r="1.1" fill="var(--bg)" />
    </svg>
  );
}

export function Logomark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="logomark"
      aria-hidden="true"
      role="presentation"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" className="lmtile" />
      <circle cx="16" cy="16" r="9" className="lmring" />
      <circle cx="16" cy="16" r="9" className="lmscan" />
      <path d="M16 7v3.4M16 21.6V25M7 16h3.4M21.6 16H25" className="lmticks" />
      <circle cx="16" cy="16" r="3.1" className="lmcore" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <Logomark />
      <span className="wmtext">
        Shake<span className="wmdown">down</span>
      </span>
    </span>
  );
}

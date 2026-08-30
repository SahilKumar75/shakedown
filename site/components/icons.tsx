type IconProps = { className?: string };

function base(className?: string) {
  return `icon${className ? ` ${className}` : ""}`;
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <path d="M3.5 1.5h6l3 3v10h-9z" />
      <path d="M9.5 1.5v3h3" />
    </svg>
  );
}

export function HoldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.6v4.2M8 11.2v.4" />
    </svg>
  );
}

export function ClearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M5.2 8.2l2 2 3.6-4.2" />
    </svg>
  );
}

export function RunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <path d="M2.5 3.5l4 3.2-4 3.2" />
      <path d="M8 12h5.5" />
    </svg>
  );
}

export function ProbeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <circle cx="7" cy="7" r="4.4" />
      <path d="M10.4 10.4l3.1 3.1" />
    </svg>
  );
}

export function AgentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <rect x="3" y="5.5" width="10" height="8" rx="2" />
      <path d="M8 2v3.5M5.8 9h.01M10.2 9h.01" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.4V8l2.4 1.7" />
    </svg>
  );
}

export function CoinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={base(className)} aria-hidden="true">
      <ellipse cx="8" cy="4.6" rx="5.4" ry="2.2" />
      <path d="M2.6 4.6v6.8c0 1.2 2.4 2.2 5.4 2.2s5.4-1 5.4-2.2V4.6" />
      <path d="M2.6 8c0 1.2 2.4 2.2 5.4 2.2s5.4-1 5.4-2.2" />
    </svg>
  );
}

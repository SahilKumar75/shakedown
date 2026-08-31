"use client";

import { useRef } from "react";

/**
 * A card that lights where the cursor is. The glow is painted from two custom
 * properties updated on pointer move, so nothing re-renders and nothing lays out.
 */
export function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const node = host.current;
    if (!node) {
      return;
    }
    const box = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - box.left}px`);
    node.style.setProperty("--my", `${event.clientY - box.top}px`);
    node.style.setProperty("--lit", "1");
  }

  function leave() {
    host.current?.style.setProperty("--lit", "0");
  }

  return (
    <div
      ref={host}
      className={`spot ${className}`.trim()}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </div>
  );
}

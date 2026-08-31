"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pulls its child toward the cursor once the cursor is inside `range`, easing to
 * the target rather than snapping to it, and springs back on leave. Hand written
 * against transform only, so it never triggers layout and needs no motion library.
 */
export function Magnetic({
  children,
  intensity = 0.34,
  range = 110,
  className = "",
}: {
  children: React.ReactNode;
  intensity?: number;
  range?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const frame = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listen = () => setReduced(query.matches);
    query.addEventListener("change", listen);
    return () => query.removeEventListener("change", listen);
  }, []);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const node = host.current;
    if (!node) {
      return;
    }

    const step = () => {
      current.current.x += (target.current.x - current.current.x) * 0.16;
      current.current.y += (target.current.y - current.current.y) * 0.16;
      const { x, y } = current.current;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (Math.abs(x - target.current.x) > 0.05 || Math.abs(y - target.current.y) > 0.05) {
        frame.current = requestAnimationFrame(step);
      } else {
        frame.current = null;
      }
    };

    const wake = () => {
      if (frame.current === null) {
        frame.current = requestAnimationFrame(step);
      }
    };

    const move = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      if (distance < range) {
        const falloff = 1 - distance / range;
        target.current = { x: dx * intensity * falloff, y: dy * intensity * falloff };
      } else {
        target.current = { x: 0, y: 0 };
      }
      wake();
    };

    const leave = () => {
      target.current = { x: 0, y: 0 };
      wake();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [intensity, range, reduced]);

  return (
    <span ref={host} className={`magnetic ${className}`.trim()}>
      {children}
    </span>
  );
}

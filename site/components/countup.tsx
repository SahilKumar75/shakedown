"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  duration = 900,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setArmed(true);
      return;
    }
    setShown(0);
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setArmed(true);
            watcher.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) {
      return;
    }
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, value, duration]);

  return (
    <span ref={host}>
      {shown}
      {suffix}
    </span>
  );
}

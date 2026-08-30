"use client";

import { useEffect, useRef, useState } from "react";

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section";
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            watcher.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  return (
    <Tag
      ref={host as never}
      className={`reveal${shown ? " shown" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

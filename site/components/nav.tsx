"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./logo";

/**
 * Morphing pill navigation, after the MorphicNavbar pattern: the group is one solid
 * bar and the active item detaches from it, rounding on every corner while its
 * neighbours square off toward the gap it left. Ported to this project's plain CSS,
 * since the site carries no Tailwind, and wired to the real routes rather than to
 * local state, so the shape follows the page you are actually on.
 */

const ITEMS: { href: string; name: string }[] = [
  { href: "/", name: "overview" },
  { href: "/report", name: "review" },
  { href: "/trajectory", name: "agent" },
  { href: "/compare", name: "compare" },
  { href: "/method", name: "method" },
  { href: "/changelog", name: "changelog" },
  { href: "/reproduce", name: "reproduce" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="mastrow">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <Wordmark />
      </Link>

      <nav className={open ? "morph open" : "morph"}>
        <div className="morphgroup">
          {ITEMS.map((item, index) => {
            const active = isActive(path, item.href);
            const previous = index > 0 ? ITEMS[index - 1] : null;
            const next = index < ITEMS.length - 1 ? ITEMS[index + 1] : null;
            const roundLeft = index === 0 || (previous ? isActive(path, previous.href) : false);
            const roundRight =
              index === ITEMS.length - 1 || (next ? isActive(path, next.href) : false);

            const shape = active
              ? "morphitem on"
              : `morphitem${roundLeft ? " roundl" : ""}${roundRight ? " roundr" : ""}`;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={shape}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <a
        className="navcta"
        href="https://github.com/SahilKumar75/shakedown"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 16 16" className="icon" aria-hidden="true">
          <path
            d="M8 .8a7.2 7.2 0 0 0-2.28 14c.36.07.49-.15.49-.35v-1.2c-2 .44-2.43-.97-2.43-.97-.33-.83-.8-1.06-.8-1.06-.66-.45.05-.44.05-.44.73.05 1.11.75 1.11.75.65 1.11 1.7.79 2.11.6.07-.47.25-.79.46-.97-1.6-.18-3.28-.8-3.28-3.56 0-.79.28-1.43.75-1.93-.08-.18-.32-.91.07-1.9 0 0 .6-.2 1.98.73a6.9 6.9 0 0 1 3.6 0c1.38-.93 1.98-.73 1.98-.73.39.99.15 1.72.07 1.9.47.5.75 1.14.75 1.93 0 2.77-1.69 3.38-3.29 3.56.26.22.49.66.49 1.33v1.97c0 .2.13.43.5.35A7.2 7.2 0 0 0 8 .8Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
        Source
      </a>

      <button
        className="navburger"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span />
        <span />
      </button>
    </div>
  );
}

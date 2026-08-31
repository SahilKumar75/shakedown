"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./logo";
import { AgentIcon, ClearIcon, ClockIcon, FileIcon, ProbeIcon, RunIcon } from "./icons";

const GROUPS = [
  {
    label: "Product",
    items: [
      {
        href: "/report",
        title: "Review console",
        blurb: "Findings as a pull request thread",
        icon: <FileIcon />,
      },
      {
        href: "/trajectory",
        title: "Agent trajectories",
        blurb: "Every step, including the dead ends",
        icon: <AgentIcon />,
      },
      {
        href: "/method",
        title: "Method",
        blurb: "The one rule, and the twelve classes",
        icon: <ProbeIcon />,
      },
    ],
  },
  {
    label: "Evidence",
    items: [
      {
        href: "/compare",
        title: "Compare",
        blurb: "Against the manual baseline",
        icon: <ClearIcon />,
      },
      {
        href: "/changelog",
        title: "Changelog",
        blurb: "What was tried, and reverted",
        icon: <ClockIcon />,
      },
      {
        href: "/reproduce",
        title: "Reproduce",
        blurb: "Three commands from a clean machine",
        icon: <RunIcon />,
      },
    ],
  },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  const inGroup = (items: { href: string }[]) => items.some((item) => item.href === path);

  return (
    <div className={stuck ? "mastrow stuck" : "mastrow"}>
      <Link href="/" className="brand">
        <Wordmark />
      </Link>

      <nav className="navmenu" onMouseLeave={() => setOpen(null)}>
        <Link href="/" className={path === "/" ? "navlink on" : "navlink"}>
          Overview
        </Link>

        {GROUPS.map((group) => (
          <div
            className="navgroup"
            key={group.label}
            onMouseEnter={() => setOpen(group.label)}
          >
            <button
              className={
                open === group.label || inGroup(group.items) ? "navlink on" : "navlink"
              }
              onClick={() => setOpen(open === group.label ? null : group.label)}
              aria-expanded={open === group.label}
            >
              {group.label}
              <svg viewBox="0 0 10 6" className="navcaret" aria-hidden="true">
                <path d="M1 1l4 4 4-4" />
              </svg>
            </button>

            {open === group.label ? (
              <div className="navpanel">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={item.href === path ? "navitem on" : "navitem"}
                  >
                    <span className="navicon">{item.icon}</span>
                    <span>
                      <span className="navtitle">{item.title}</span>
                      <span className="navblurb">{item.blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
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
        onClick={() => setMobile(!mobile)}
        aria-label="Menu"
        aria-expanded={mobile}
      >
        <span />
        <span />
      </button>

      {mobile ? (
        <div className="navdrawer">
          <Link href="/" className="navitem">
            <span className="navtitle">Overview</span>
          </Link>
          {GROUPS.flatMap((group) => group.items).map((item) => (
            <Link key={item.href} href={item.href} className="navitem">
              <span className="navicon">{item.icon}</span>
              <span>
                <span className="navtitle">{item.title}</span>
                <span className="navblurb">{item.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

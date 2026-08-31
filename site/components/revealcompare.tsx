"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClearIcon, HoldIcon, ProbeIcon, RunIcon } from "./icons";

/**
 * A draggable divider over the same bundle, reviewed two ways. The left is what the
 * two manual checks surface, the right is what Shakedown reports. Both panels are
 * real output from the corpus rather than mock copy.
 */
export function RevealCompare() {
  const host = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(46);
  const dragging = useRef(false);

  const place = useCallback((clientX: number) => {
    const node = host.current;
    if (!node) {
      return;
    }
    const box = node.getBoundingClientRect();
    const next = ((clientX - box.left) / box.width) * 100;
    setAt(Math.min(93, Math.max(7, next)));
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (dragging.current) {
        place(event.clientX);
      }
    };
    const stop = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [place]);

  function key(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      setAt((value) => Math.max(7, value - 4));
    }
    if (event.key === "ArrowRight") {
      setAt((value) => Math.min(93, value + 4));
    }
  }

  return (
    <div className="reveal2" ref={host}>
      <div className="r2pane base">
        <div className="r2head">
          <span className="r2tag">by hand</span>
          <span className="r2sub">run the reference, run an empty submission</span>
        </div>
        <ul className="r2list">
          <li className="ok">
            <ClearIcon /> reference earns reward 1.0
          </li>
          <li className="ok">
            <ClearIcon /> empty submission earns 0.0
          </li>
          <li className="idle">no further signal available</li>
          <li className="idle">&nbsp;</li>
          <li className="idle">&nbsp;</li>
        </ul>
        <div className="r2verdict pass">looks fine, ship it</div>
      </div>

      <div className="r2pane ours" style={{ clipPath: `inset(0 0 0 ${at}%)` }}>
        <div className="r2head">
          <span className="r2tag ours">shakedown</span>
          <span className="r2sub">six probes, every claim executed</span>
        </div>
        <ul className="r2list">
          <li className="ok">
            <ClearIcon /> reference earns reward 1.0
          </li>
          <li className="ok">
            <ClearIcon /> empty submission earns 0.0
          </li>
          <li className="bad">
            <HoldIcon /> answer_leak in env/reviewer_notes/
          </li>
          <li className="proof">
            <RunIcon /> a candidate copying that file earned 1.0
          </li>
          <li className="bad">
            <ProbeIcon /> mutation survives on 3 held out cases
          </li>
        </ul>
        <div className="r2verdict hold">held, with the run that proves it</div>
      </div>

      <button
        className="r2handle"
        style={{ left: `${at}%` }}
        onPointerDown={(event) => {
          dragging.current = true;
          place(event.clientX);
        }}
        onKeyDown={key}
        aria-label="Drag to compare the manual check against Shakedown"
        aria-valuenow={Math.round(at)}
        aria-valuemin={7}
        aria-valuemax={93}
        role="slider"
        tabIndex={0}
      >
        <span className="r2grip">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M8 6.5 4.5 10 8 13.5M12 6.5 15.5 10 12 13.5" />
          </svg>
        </span>
      </button>
    </div>
  );
}

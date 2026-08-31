import Link from "next/link";
import { Spotlight } from "./spotlight";
import { AgentIcon, ClearIcon, ClockIcon, CoinIcon, FileIcon, HoldIcon, ProbeIcon, RunIcon } from "./icons";

function Sparkline() {
  return (
    <svg viewBox="0 0 160 44" className="mini" aria-hidden="true">
      <path d="M2 34 L26 30 L50 32 L74 18 L98 22 L122 9 L158 6" className="minipath" />
      <circle cx="158" cy="6" r="3.2" className="minidot" />
    </svg>
  );
}

function Stack() {
  return (
    <svg viewBox="0 0 160 44" className="mini" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <rect
          key={index}
          x={4 + index * 26}
          y={6}
          width="18"
          height="32"
          rx="3"
          className={index < 4 ? "minibar hit" : "minibar"}
          style={{ animationDelay: `${index * 80}ms` }}
        />
      ))}
    </svg>
  );
}

export function Bento() {
  return (
    <div className="bento">
      <Spotlight className="bcard wide">
        <span className="bicon accent">
          <RunIcon />
        </span>
        <h3>Every finding is a run, not an opinion</h3>
        <p>
          A probe reports a defect only after reproducing it. The command that proved it is quoted
          under the finding, so a reviewer can rerun it rather than trust it.
        </p>
        <Sparkline />
      </Spotlight>

      <Spotlight className="bcard">
        <span className="bicon done">
          <AgentIcon />
        </span>
        <h3>An agent where probes stop</h3>
        <p>Reads the verifier, writes the submission that would cheat it, runs it.</p>
        <Link href="/trajectory" className="blink">
          See its trajectories &rarr;
        </Link>
      </Spotlight>

      <Spotlight className="bcard">
        <span className="bicon success">
          <ClockIcon />
        </span>
        <h3>Seconds, not hours</h3>
        <p>Twenty four bundles inspected in about half a minute on a laptop.</p>
        <Stack />
      </Spotlight>

      <Spotlight className="bcard">
        <span className="bicon attention">
          <CoinIcon />
        </span>
        <h3>Nothing leaves the room</h3>
        <p>
          The probes decide by executing the bundle, so there is no key to configure and no service
          to call.
        </p>
      </Spotlight>

      <Spotlight className="bcard wide">
        <span className="bicon danger">
          <HoldIcon />
        </span>
        <h3>It says what it cannot catch</h3>
        <p>
          Three classes are still out of reach and they are named on the comparison page rather than
          hidden. The same corpus measures whether the next round closes them.
        </p>
        <Link href="/compare" className="blink">
          See the gap &rarr;
        </Link>
      </Spotlight>
    </div>
  );
}

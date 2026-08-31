import { AgentIcon, ClearIcon, HoldIcon, ProbeIcon } from "./icons";

export interface DefectEntry {
  defect: string;
  what: string;
  proof: string;
}

export interface Tier {
  name: string;
  note: string;
  classes: DefectEntry[];
}

const TONE = ["hand", "probe", "open"] as const;

function toneIcon(tone: string) {
  if (tone === "hand") {
    return <ClearIcon />;
  }
  if (tone === "probe") {
    return <ProbeIcon />;
  }
  return <AgentIcon />;
}

export function Tiers({
  tiers,
  status,
  label,
}: {
  tiers: Tier[];
  status: (defect: string) => { text: string; caught: boolean; partial: boolean };
  label: (defect: string) => string;
}) {
  return (
    <div className="tiers">
      {tiers.map((tier, index) => {
        const tone = TONE[Math.min(index, TONE.length - 1)];
        return (
          <section className={`tier ${tone}`} key={tier.name}>
            <header>
              <span className="tiericon">{toneIcon(tone)}</span>
              <div>
                <h3>{tier.name}</h3>
                <p>{tier.note}</p>
              </div>
            </header>
            <ul>
              {tier.classes.map((entry) => {
                const state = status(entry.defect);
                return (
                  <li key={entry.defect}>
                    <div className="clshead">
                      <code>{label(entry.defect)}</code>
                      <span
                        className={
                          state.caught ? "clsstate hit" : state.partial ? "clsstate part" : "clsstate"
                        }
                      >
                        {state.caught ? <ClearIcon /> : state.partial ? <HoldIcon /> : null}
                        {state.text}
                      </span>
                    </div>
                    <p className="clswhat">{entry.what}</p>
                    <p className="clsproof">
                      <span>proof</span> {entry.proof}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

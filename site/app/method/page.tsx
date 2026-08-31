import payload from "@/data/taxonomy.json";
import { allReports, defectLabel } from "@/lib/data";
import { Tiers, type Tier } from "@/components/tiers";
import { Reveal } from "@/components/reveal";
import { RunPlan } from "@/components/runplan";
import type { DefectClass } from "@/lib/types";

export const metadata = {
  title: "Method",
  description: "One rule: a finding is reported only when a probe reproduced it.",
};

const tiers = (payload as { tiers: Tier[] }).tiers;


export default function MethodPage() {
  const reports = allReports();

  function status(defect: string) {
    const planted = reports.filter((entry) => entry.injected === defect);
    if (planted.length === 0) {
      return { text: "not in corpus", caught: false, partial: false };
    }
    const found = planted.filter((entry) =>
      entry.findings.some((finding) => finding.defect === defect),
    );
    return {
      text: `${found.length} of ${planted.length} caught`,
      caught: found.length === planted.length,
      partial: found.length > 0 && found.length < planted.length,
    };
  }

  return (
    <main>
      <p className="eyebrow">Method</p>
      <h1>One rule, held above the rest</h1>
      <p className="lede">
        A finding is reported only when a probe reproduced it. Everything on this site describes
        something that happened on the machine, not an opinion about the code.
      </p>
      <p className="lede short">
        A review tool that asserts a defect without demonstrating it is guessing, and a guess costs
        the author the same cycle the tool was meant to save.
      </p>

      <Reveal as="section">
        <h2 className="ruled">Cheapest first</h2>
        <p className="lede short">
          Reading costs nothing, so it happens before anything is executed. Reorder the probes below
          and the command updates with them.
        </p>
        <RunPlan />
      </Reveal>

      <Reveal as="section">
        <h2 className="ruled">Twelve failure classes</h2>
        <p className="lede short">
          Grouped by what it takes to find them. The grouping is the argument for the whole project.
        </p>
        <Tiers
          tiers={tiers}
          status={status}
          label={(defect) => defectLabel(defect as DefectClass)}
        />
      </Reveal>

      <Reveal as="section">
        <h2 className="ruled">Where the mechanical part ends</h2>
        <p className="lede short">
          A weak verifier, an undetermined rule and an unwitnessed encoding all need someone to read
          the bundle as a solver would and ask whether a second reasonable answer exists. No fixed
          experiment settles that, which is why the agent layer exists and why its findings still
          have to be reproduced before they count.
        </p>
      </Reveal>
    </main>
  );
}

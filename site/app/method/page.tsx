import payload from "@/data/taxonomy.json";
import { allReports, defectLabel } from "@/lib/data";
import type { DefectClass } from "@/lib/types";

interface DefectEntry {
  defect: string;
  what: string;
  proof: string;
}

interface Tier {
  name: string;
  note: string;
  classes: DefectEntry[];
}

const tiers = (payload as { tiers: Tier[] }).tiers;

export default function MethodPage() {
  const reports = allReports();

  function status(defect: string): string {
    const planted = reports.filter((entry) => entry.injected === defect);
    if (planted.length === 0) {
      return "not in corpus";
    }
    const found = planted.filter((entry) =>
      entry.findings.some((finding) => finding.defect === defect),
    );
    return `${found.length} of ${planted.length} caught`;
  }

  return (
    <main>
      <h1>How it works</h1>
      <p className="lede">
        Shakedown holds one rule above the others. A finding is only reported when a probe can
        reproduce it, which means every line of evidence on this site describes something that
        actually happened on the machine rather than an opinion about the code. A review tool that
        asserts a defect without demonstrating it is guessing, and a guess costs the author the same
        cycle the tool was meant to save.
      </p>

      <h2>The order of work</h2>
      <p className="lede">
        Probes run cheapest first. Reading the instruction costs nothing, so wording is checked
        before anything is executed. Execution comes next because its two runs are reused by every
        later probe. The expensive probes, which run mutated references and redirected candidates,
        only run once the reference is known to pass, since there is nothing to learn from mutating
        a solution that already fails.
      </p>

      <h2>The taxonomy</h2>
      <p className="lede">
        Twelve failure classes, grouped by what it takes to find them. The grouping is the argument
        for the whole project: the first group is what a careful author already catches, the second
        is what a designed experiment reaches, and the third is what neither can settle.
      </p>

      {tiers.map((tier) => (
        <section key={tier.name} style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>{tier.name}</h3>
          <p className="lede" style={{ marginTop: 0 }}>
            {tier.note}
          </p>
          <table className="plain">
            <thead>
              <tr>
                <th>Class</th>
                <th>What it is</th>
                <th>What counts as proof</th>
                <th>In this corpus</th>
              </tr>
            </thead>
            <tbody>
              {tier.classes.map((entry) => (
                <tr key={entry.defect}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {defectLabel(entry.defect as DefectClass)}
                  </td>
                  <td>{entry.what}</td>
                  <td>{entry.proof}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{status(entry.defect)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <h2>Why the third group is left open</h2>
      <p className="lede">
        A weak verifier, an undetermined rule and an unwitnessed encoding all require reading the
        bundle the way a solver would and asking whether a second reasonable answer exists. No fixed
        experiment settles that question, so the honest thing is to say where the mechanical part
        ends rather than to report a confident finding that cannot be reproduced.
      </p>
    </main>
  );
}

import { allReports, caught, defectLabel } from "@/lib/data";
import type { DefectClass } from "@/lib/types";

export function Coverage() {
  const reports = allReports();
  const classes = Array.from(
    new Set(
      reports
        .map((entry) => entry.injected)
        .filter((name): name is DefectClass => Boolean(name)),
    ),
  ).sort();

  const rows = classes.map((name) => {
    const planted = reports.filter((entry) => entry.injected === name);
    return {
      name,
      cells: planted.map((entry) => caught(entry)),
    };
  });

  return (
    <div className="coverage">
      {rows.map((row, rowIndex) => {
        const hit = row.cells.filter(Boolean).length;
        return (
          <div className="covrow" key={row.name}>
            <span className="covname">{defectLabel(row.name)}</span>
            <span className="covcells">
              {row.cells.map((found, index) => (
                <span
                  key={index}
                  className={found ? "cell hit" : "cell miss"}
                  style={{ animationDelay: `${rowIndex * 90 + index * 70}ms` }}
                  title={found ? "reproduced" : "not caught"}
                />
              ))}
            </span>
            <span className={hit === row.cells.length ? "covscore all" : "covscore"}>
              {hit} of {row.cells.length}
            </span>
          </div>
        );
      })}
      <p className="covkey">
        <span className="cell hit still" /> reproduced on the bench
        <span className="cell miss still" /> modelled, not yet caught
      </p>
    </div>
  );
}

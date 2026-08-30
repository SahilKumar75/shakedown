import { comparison } from "@/lib/compare";

export function ArmBars() {
  const data = comparison();
  const arms = [
    { label: data.baseline.name, score: data.baseline.score, tone: "base" },
    { label: data.shakedown.name, score: data.shakedown.score, tone: "ours" },
  ];
  const planted = data.shakedown.score.planted;

  return (
    <div className="arms">
      {arms.map((arm, index) => {
        const share = planted ? arm.score.caught / planted : 0;
        return (
          <div className="arm" key={arm.label}>
            <div className="armhead">
              <span className="armname">{arm.label}</span>
              <span className="armfig">
                {arm.score.caught}
                <span className="of"> of {planted}</span>
              </span>
            </div>
            <div className="armtrack">
              <div
                className={`armfill ${arm.tone}`}
                style={{ width: `${share * 100}%`, animationDelay: `${index * 180}ms` }}
              />
            </div>
            <div className="armfoot">
              {Math.round(share * 100)} percent of planted defects, {arm.score.clean_held} of{" "}
              {arm.score.clean} clean bundles wrongly held
            </div>
          </div>
        );
      })}
    </div>
  );
}

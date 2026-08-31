const FILES = [
  { name: "instruction.md", ships: true },
  { name: "env/", ships: true },
  { name: "solution/solve.py", ships: false },
  { name: "tests/verify.py", ships: false },
];

export function BundleScan() {
  return (
    <div className="scanart" aria-hidden="true">
      <svg viewBox="0 0 300 232" role="presentation">
        <defs>
          <clipPath id="scanclip">
            <rect x="14" y="14" width="272" height="204" rx="8" />
          </clipPath>
        </defs>

        <rect x="14" y="14" width="272" height="204" rx="8" className="scanbox" />

        <g className="scanrows">
          {FILES.map((file, index) => {
            const y = 40 + index * 42;
            return (
              <g key={file.name} style={{ animationDelay: `${300 + index * 130}ms` }} className="scanrow">
                <rect x="30" y={y} width="240" height="30" rx="5" className="scanfile" />
                <rect x="42" y={y + 11} width="9" height="9" rx="2" className={file.ships ? "scanchip ships" : "scanchip"} />
                <text x="60" y={y + 20} className="scanname">
                  {file.name}
                </text>
                {index === 1 ? (
                  <g className="scanflag">
                    <rect x="212" y={y + 7} width="46" height="17" rx="8" className="scanbadge" />
                    <text x="235" y={y + 19} className="scanbadgetext">
                      leak
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>

        <g clipPath="url(#scanclip)">
          <rect x="14" y="0" width="272" height="46" className="scanbeam" />
        </g>
      </svg>
    </div>
  );
}

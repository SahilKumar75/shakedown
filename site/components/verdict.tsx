export function Verdict({ verdict }: { verdict: "hold" | "clear" }) {
  return <span className={`badge ${verdict}`}>{verdict}</span>;
}

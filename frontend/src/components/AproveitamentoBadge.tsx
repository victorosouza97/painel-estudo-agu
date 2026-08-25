import { formatPct } from "../lib/progress";

export default function AproveitamentoBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="muted small">Sem questões registradas</span>;
  return <span className="badge">{formatPct(pct)} de aproveitamento</span>;
}

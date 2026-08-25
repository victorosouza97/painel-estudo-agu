import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, AssuntoSummary } from "../lib/api";
import { aggregateAssuntos, Aggregate } from "../lib/progress";
import ProgressBar from "../components/ProgressBar";
import AproveitamentoBadge from "../components/AproveitamentoBadge";

interface DisciplinaAgg extends Aggregate {
  disciplina: string;
  total: number;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaAgg[]>([]);
  const [totalAgg, setTotalAgg] = useState<Aggregate | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .assuntosTodos()
      .then((assuntos) => {
        if (cancelled) return;
        const map = new Map<string, AssuntoSummary[]>();
        for (const a of assuntos) {
          const list = map.get(a.disciplina) || [];
          list.push(a);
          map.set(a.disciplina, list);
        }
        const agg: DisciplinaAgg[] = Array.from(map.entries()).map(([disciplina, itens]) => ({
          disciplina,
          total: itens.length,
          ...aggregateAssuntos(itens),
        }));
        agg.sort((a, b) => a.disciplina.localeCompare(b.disciplina, "pt-BR"));
        setDisciplinas(agg);
        setTotalAgg(aggregateAssuntos(assuntos));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar as disciplinas.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) return <p>Carregando disciplinas...</p>;
  if (error)
    return (
      <div>
        <p className="error-text">{error}</p>
        <button onClick={() => setAttempt((a) => a + 1)}>Tentar novamente</button>
      </div>
    );

  return (
    <div>
      <h1>Disciplinas</h1>

      {totalAgg && (
        <div className="secao total-summary">
          <div className="row-gap">
            <strong>Progresso total</strong>
            <AproveitamentoBadge pct={totalAgg.aproveitamentoPct} />
          </div>
          <ProgressBar value={totalAgg.progressoMedio} />
        </div>
      )}

      <div className="card-grid">
        {disciplinas.map((d) => (
          <Link key={d.disciplina} to={`/disciplina/${encodeURIComponent(d.disciplina)}`} className="card">
            <h2>{d.disciplina}</h2>
            <p className="muted">{d.total} assunto(s)</p>
            <ProgressBar value={d.progressoMedio} />
            <AproveitamentoBadge pct={d.aproveitamentoPct} />
          </Link>
        ))}
      </div>
    </div>
  );
}

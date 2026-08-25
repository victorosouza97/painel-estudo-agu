import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, AssuntoSummary } from "../lib/api";
import { assuntoProgress, aggregateAssuntos, aproveitamento, formatPct } from "../lib/progress";
import ProgressBar from "../components/ProgressBar";
import AproveitamentoBadge from "../components/AproveitamentoBadge";

export default function Disciplina() {
  const { nome } = useParams<{ nome: string }>();
  const [assuntos, setAssuntos] = useState<AssuntoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!nome) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .assuntos(nome)
      .then((data) => {
        if (cancelled) return;
        setAssuntos(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar os assuntos.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nome, attempt]);

  if (loading) return <p>Carregando...</p>;
  if (error)
    return (
      <div>
        <p className="error-text">{error}</p>
        <button onClick={() => setAttempt((a) => a + 1)}>Tentar novamente</button>
      </div>
    );

  const agg = aggregateAssuntos(assuntos);

  return (
    <div>
      <Link to="/" className="back-link">
        ← Disciplinas
      </Link>
      <h1>{nome}</h1>

      <div className="secao total-summary">
        <div className="row-gap">
          <strong>Progresso da disciplina</strong>
          <AproveitamentoBadge pct={agg.aproveitamentoPct} />
        </div>
        <ProgressBar value={agg.progressoMedio} />
      </div>

      <div className="list">
        {assuntos.map((a) => {
          const pct = aproveitamento(a.questoesAcertos, a.questoesErros);
          return (
            <Link key={a.id} to={`/assunto/${a.id}`} className="list-item">
              <div className="list-item-main">
                <span className="tag">
                  {a.semana} · Meta {a.metaNumero}
                </span>
                <span className="list-item-title">{a.assunto}</span>
                {pct != null && (
                  <span className="muted small">{formatPct(pct)} de aproveitamento em questões</span>
                )}
              </div>
              <div className="list-item-progress">
                <ProgressBar value={assuntoProgress(a)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

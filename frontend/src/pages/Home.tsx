import { Link } from "react-router-dom";
import { useAssuntosContext } from "../lib/AssuntosContext";
import { aggregateAssuntos, assuntoProgress } from "../lib/progress";
import ProgressBar from "../components/ProgressBar";
import AproveitamentoBadge from "../components/AproveitamentoBadge";

export default function Home() {
  const { assuntos, disciplinas, porDisciplina, agregadoTotal, loading, error, refetch } =
    useAssuntosContext();

  if (loading) return <p>Carregando disciplinas...</p>;
  if (error)
    return (
      <div>
        <p className="error-text">{error}</p>
        <button onClick={refetch}>Tentar novamente</button>
      </div>
    );

  const proximo = assuntos.find((a) => assuntoProgress(a) < 100);

  return (
    <div>
      <h1>Disciplinas</h1>

      <div className="secao total-summary">
        <div className="row-gap">
          <strong>Progresso total</strong>
          <AproveitamentoBadge pct={agregadoTotal.aproveitamentoPct} />
        </div>
        <ProgressBar value={agregadoTotal.progressoMedio} />
      </div>

      {proximo && (
        <Link to={`/assunto/${proximo.id}`} className="continue-card">
          <div>
            <span className="continue-card-eyebrow">Continue de onde parou</span>
            <span className="continue-card-title">{proximo.assunto}</span>
            <span className="muted small">
              {proximo.disciplina} · {proximo.semana} · Meta {proximo.metaNumero}
            </span>
          </div>
          <span className="continue-card-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      )}

      <div className="card-grid">
        {disciplinas.map((disciplina) => {
          const itens = porDisciplina.get(disciplina) || [];
          const agg = aggregateAssuntos(itens);
          return (
            <Link key={disciplina} to={`/disciplina/${encodeURIComponent(disciplina)}`} className="card">
              <h2>{disciplina}</h2>
              <p className="muted">{itens.length} assunto(s)</p>
              <ProgressBar value={agg.progressoMedio} />
              <AproveitamentoBadge pct={agg.aproveitamentoPct} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

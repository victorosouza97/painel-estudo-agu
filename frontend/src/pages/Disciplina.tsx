import { Link, useParams } from "react-router-dom";
import { useAssuntosContext } from "../lib/AssuntosContext";
import { assuntoProgress, aggregateAssuntos, aproveitamento, formatPct } from "../lib/progress";
import ProgressBar from "../components/ProgressBar";
import AproveitamentoBadge from "../components/AproveitamentoBadge";

export default function Disciplina() {
  const { nome } = useParams<{ nome: string }>();
  const { porDisciplina, loading, error, refetch } = useAssuntosContext();

  if (loading) return <p>Carregando...</p>;
  if (error)
    return (
      <div>
        <p className="error-text">{error}</p>
        <button onClick={refetch}>Tentar novamente</button>
      </div>
    );

  const nomeDecodificado = nome ? decodeURIComponent(nome) : "";
  const assuntos = porDisciplina.get(nomeDecodificado) || [];
  const agg = aggregateAssuntos(assuntos);

  return (
    <div>
      <Link to="/" className="back-link">
        ← Disciplinas
      </Link>
      <h1>{nomeDecodificado}</h1>

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

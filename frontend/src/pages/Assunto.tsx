import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, AssuntoDetail } from "../lib/api";
import SecaoLeituraBase from "../components/SecaoLeituraBase";
import SecaoLegislacao from "../components/SecaoLegislacao";
import SecaoResumoConteudo from "../components/SecaoResumoConteudo";
import SecaoQuestoes from "../components/SecaoQuestoes";
import ProgressBar from "../components/ProgressBar";
import { computeProgress } from "../lib/progress";

function progressoDetalhe(a: AssuntoDetail): number {
  const legislacaoTotal = a.legislacaoItens.length;
  const legislacaoConcluida = a.legislacaoItens.filter((i) => i.concluido).length;
  const resumoTotal =
    a.resumoConteudo?.paginaInicio != null && a.resumoConteudo?.paginaFim != null
      ? a.resumoConteudo.paginaFim - a.resumoConteudo.paginaInicio + 1
      : null;
  const resumoLidas =
    a.resumoConteudo?.paginaInicio != null && a.resumoConteudo?.ultimaPaginaLida != null
      ? Math.max(0, a.resumoConteudo.ultimaPaginaLida - a.resumoConteudo.paginaInicio + 1)
      : 0;
  return computeProgress({
    leituraBaseDisponivel: a.leituraBase?.disponivel ?? false,
    leituraBaseConcluido: a.leituraBase?.concluido ?? false,
    legislacaoTotal,
    legislacaoConcluida,
    resumoTotal,
    resumoLidas,
  });
}

export default function Assunto() {
  const { id } = useParams<{ id: string }>();
  const [assunto, setAssunto] = useState<AssuntoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBruto, setShowBruto] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setAssunto(null);
    setError(null);
    api
      .assunto(id)
      .then((data) => {
        if (!cancelled) setAssunto(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar este assunto.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (error)
    return (
      <div>
        <p className="error-text">{error}</p>
        <button onClick={() => setAttempt((a) => a + 1)}>Tentar novamente</button>
      </div>
    );
  if (!assunto) return <p>Carregando...</p>;

  function onChange(patch: Partial<AssuntoDetail>) {
    setAssunto((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <div>
      <Link to={`/disciplina/${encodeURIComponent(assunto.disciplina)}`} className="back-link">
        ← {assunto.disciplina}
      </Link>
      <span className="tag">
        {assunto.semana} · Meta {assunto.metaNumero}
      </span>
      <h1>{assunto.assunto}</h1>
      <ProgressBar value={progressoDetalhe(assunto)} />

      <div className="secoes">
        <SecaoLeituraBase assunto={assunto} onChange={onChange} />
        <SecaoLegislacao assunto={assunto} onChange={onChange} />
        <SecaoResumoConteudo assunto={assunto} onChange={onChange} />
        <SecaoQuestoes assunto={assunto} onChange={onChange} />
      </div>

      <div className="bruto-toggle">
        <button className="link-button" onClick={() => setShowBruto((v) => !v)}>
          {showBruto ? "Ocultar" : "Ver"} passo a passo original do material
        </button>
        {showBruto && <pre className="bruto-box">{assunto.passoAPassoBruto}</pre>}
      </div>
    </div>
  );
}

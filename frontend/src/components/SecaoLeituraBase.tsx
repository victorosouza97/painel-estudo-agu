import { api, AssuntoDetail } from "../lib/api";
import ProgressBar from "./ProgressBar";

export default function SecaoLeituraBase({
  assunto,
  onChange,
}: {
  assunto: AssuntoDetail;
  onChange: (patch: Partial<AssuntoDetail>) => void;
}) {
  const lb = assunto.leituraBase;

  async function toggle() {
    const novo = !lb?.concluido;
    await api.setLeituraBase(assunto.id, novo);
    onChange({
      leituraBase: {
        disponivel: lb?.disponivel ?? true,
        nomePdfBase: lb?.nomePdfBase ?? null,
        concluido: novo,
        concluidoEm: novo ? new Date().toISOString() : null,
      },
    });
  }

  return (
    <section className="secao">
      <h2>1. Leitura Base (PDF)</h2>
      {lb?.disponivel && <ProgressBar value={lb.concluido ? 100 : 0} />}
      {!lb?.disponivel && (
        <p className="muted">Este assunto não indicou leitura de PDF base específico.</p>
      )}
      {lb?.disponivel && lb.nomePdfBase && (
        <p className="muted">
          PDF Base: <strong>{lb.nomePdfBase}</strong>
        </p>
      )}
      <label className="checkbox-row">
        <input type="checkbox" checked={!!lb?.concluido} onChange={toggle} />
        Leitura do PDF Base concluída
      </label>
      {lb?.concluido && lb.concluidoEm && (
        <p className="muted small">Concluído em {new Date(lb.concluidoEm).toLocaleDateString("pt-BR")}</p>
      )}
    </section>
  );
}

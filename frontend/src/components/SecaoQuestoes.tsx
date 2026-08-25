import { useState } from "react";
import { api, AssuntoDetail } from "../lib/api";
import { aproveitamento, formatPct } from "../lib/progress";

export default function SecaoQuestoes({
  assunto,
  onChange,
}: {
  assunto: AssuntoDetail;
  onChange: (patch: Partial<AssuntoDetail>) => void;
}) {
  const filtro = assunto.questoesFiltro;
  const sessoes = assunto.questoesSessoes;
  const [acertos, setAcertos] = useState("");
  const [erros, setErros] = useState("");
  const [saving, setSaving] = useState(false);

  const totalAcertos = sessoes.reduce((s, q) => s + q.acertos, 0);
  const totalErros = sessoes.reduce((s, q) => s + q.erros, 0);
  const pct = aproveitamento(totalAcertos, totalErros);

  async function registrar() {
    const a = Number(acertos) || 0;
    const e = Number(erros) || 0;
    if (a === 0 && e === 0) return;
    setSaving(true);
    try {
      const sessao = await api.addQuestoesSessao(assunto.id, a, e);
      onChange({ questoesSessoes: [sessao, ...sessoes] });
      setAcertos("");
      setErros("");
    } finally {
      setSaving(false);
    }
  }

  async function remover(id: string) {
    await api.removeQuestoesSessao(id);
    onChange({ questoesSessoes: sessoes.filter((s) => s.id !== id) });
  }

  return (
    <section className="secao">
      <h2>4. Questões</h2>

      {filtro ? (
        <div className="filtro-box">
          <div>
            <strong>Banca:</strong> {filtro.banca}
          </div>
          <div>
            <strong>Disciplina:</strong> {filtro.disciplina}
          </div>
          <div>
            <strong>Assunto:</strong> {filtro.assuntoCodigo}
          </div>
          <div>
            <strong>Nível:</strong> {filtro.nivel}
          </div>
          <div>
            <strong>Área:</strong> {filtro.area}
          </div>
          <div>
            <strong>Modalidade:</strong> {filtro.modalidade}
          </div>
          {filtro.quantidadeSugerida && (
            <div>
              <strong>Sugestão:</strong> pelo menos {filtro.quantidadeSugerida} questões
            </div>
          )}
        </div>
      ) : (
        <p className="muted">Filtro sugerido não identificado para este assunto.</p>
      )}

      <div className="questoes-summary">
        <span>
          Total: {totalAcertos + totalErros} questão(ões) em {sessoes.length} sessão(ões)
        </span>
        {pct != null && <span className="badge">{formatPct(pct)} de aproveitamento</span>}
      </div>

      <div className="add-row">
        <input
          type="number"
          min={0}
          placeholder="Acertos"
          value={acertos}
          onChange={(e) => setAcertos(e.target.value)}
        />
        <input
          type="number"
          min={0}
          placeholder="Erros"
          value={erros}
          onChange={(e) => setErros(e.target.value)}
        />
        <button onClick={registrar} disabled={saving}>
          Registrar sessão
        </button>
      </div>

      {sessoes.length > 0 && (
        <ul className="sessao-list">
          {sessoes.map((s) => (
            <li key={s.id}>
              <span>{new Date(s.data).toLocaleDateString("pt-BR")}</span>
              <span>
                {s.acertos} acertos / {s.erros} erros
              </span>
              <button className="icon-button" onClick={() => remover(s.id)} title="Remover">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

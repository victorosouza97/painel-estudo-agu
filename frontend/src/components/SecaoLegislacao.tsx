import { useState } from "react";
import { api, AssuntoDetail, LegislacaoItem } from "../lib/api";
import ProgressBar from "./ProgressBar";

export default function SecaoLegislacao({
  assunto,
  onChange,
}: {
  assunto: AssuntoDetail;
  onChange: (patch: Partial<AssuntoDetail>) => void;
}) {
  const [novoTexto, setNovoTexto] = useState("");
  const [adding, setAdding] = useState(false);
  const itens = assunto.legislacaoItens;
  const concluidos = itens.filter((i) => i.concluido).length;

  async function toggle(item: LegislacaoItem) {
    const novo = !item.concluido;
    await api.toggleLegislacao(assunto.id, item.id, novo);
    onChange({
      legislacaoItens: itens.map((i) => (i.id === item.id ? { ...i, concluido: novo } : i)),
    });
  }

  async function remover(item: LegislacaoItem) {
    await api.removeLegislacao(assunto.id, item.id);
    onChange({ legislacaoItens: itens.filter((i) => i.id !== item.id) });
  }

  async function adicionar() {
    if (!novoTexto.trim()) return;
    setAdding(true);
    try {
      const item = await api.addLegislacao(assunto.id, novoTexto.trim());
      onChange({ legislacaoItens: [...itens, item] });
      setNovoTexto("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="secao">
      <h2>
        2. Legislação{" "}
        <span className="muted small">
          ({concluidos}/{itens.length})
        </span>
      </h2>
      {itens.length > 0 && <ProgressBar value={(concluidos / itens.length) * 100} />}
      {itens.length === 0 && <p className="muted">Nenhum dispositivo identificado automaticamente.</p>}
      <ul className="check-list">
        {itens.map((item) => (
          <li key={item.id}>
            <label className="checkbox-row">
              <input type="checkbox" checked={item.concluido} onChange={() => toggle(item)} />
              <span className={item.concluido ? "strike" : ""}>{item.texto}</span>
            </label>
            <button className="icon-button" onClick={() => remover(item)} title="Remover">
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="add-row">
        <input
          placeholder="Adicionar dispositivo (ex: Art. 5º, LXXV, da CF)"
          value={novoTexto}
          onChange={(e) => setNovoTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <button onClick={adicionar} disabled={adding}>
          Adicionar
        </button>
      </div>
    </section>
  );
}

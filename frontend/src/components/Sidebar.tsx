import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useAssuntosContext } from "../lib/AssuntosContext";
import { assuntoProgress } from "../lib/progress";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className={`chevron ${open ? "open" : ""}`}
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { porDisciplina, disciplinas, loading, error } = useAssuntosContext();
  const params = useParams<{ nome?: string; id?: string }>();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // discover the discipline of the currently open assunto (if any), to auto-expand it
  const activeDisciplina = useMemo(() => {
    if (params.nome) return decodeURIComponent(params.nome);
    if (params.id) {
      for (const [disc, itens] of porDisciplina) {
        if (itens.some((a) => a.id === params.id)) return disc;
      }
    }
    return null;
  }, [params.nome, params.id, porDisciplina]);

  useEffect(() => {
    if (activeDisciplina) {
      setExpanded((prev) => new Set(prev).add(activeDisciplina));
    }
  }, [activeDisciplina]);

  const termo = normalize(query.trim());
  const filtrando = termo.length > 0;

  function toggle(disciplina: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(disciplina)) next.delete(disciplina);
      else next.add(disciplina);
      return next;
    });
  }

  return (
    <nav className="sidebar-nav" aria-label="Disciplinas e assuntos">
      <div className="sidebar-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar disciplina ou assunto…"
          aria-label="Buscar disciplina ou assunto"
        />
      </div>

      {loading && <p className="muted small sidebar-status">Carregando…</p>}
      {error && <p className="error-text small sidebar-status">{error}</p>}

      <ul className="sidebar-tree">
        {disciplinas.map((disciplina) => {
          const itens = porDisciplina.get(disciplina) || [];
          const itensFiltrados = filtrando
            ? itens.filter(
                (a) => normalize(a.assunto).includes(termo) || normalize(a.metaNumero).includes(termo)
              )
            : itens;
          const disciplinaCombina = normalize(disciplina).includes(termo);

          if (filtrando && !disciplinaCombina && itensFiltrados.length === 0) return null;

          const mostrarItens = filtrando || expanded.has(disciplina);
          const progresso = itens.length
            ? Math.round(itens.reduce((s, a) => s + assuntoProgress(a), 0) / itens.length)
            : 0;

          return (
            <li key={disciplina} className="sidebar-group">
              <div className="sidebar-group-header">
                <button
                  type="button"
                  className="sidebar-group-toggle"
                  onClick={() => toggle(disciplina)}
                  aria-expanded={mostrarItens}
                >
                  <ChevronIcon open={mostrarItens} />
                </button>
                <NavLink
                  to={`/disciplina/${encodeURIComponent(disciplina)}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `sidebar-group-name${isActive && !params.id ? " active" : ""}`
                  }
                  title={disciplina}
                >
                  {disciplina}
                </NavLink>
                <span className="sidebar-group-pct">{progresso}%</span>
              </div>

              {mostrarItens && (
                <ul className="sidebar-topics">
                  {(filtrando ? itensFiltrados : itens).map((a) => {
                    const pct = assuntoProgress(a);
                    return (
                      <li key={a.id}>
                        <NavLink
                          to={`/assunto/${a.id}`}
                          onClick={onNavigate}
                          className={({ isActive }) => `sidebar-topic${isActive ? " active" : ""}`}
                          title={a.assunto}
                        >
                          <span
                            className="sidebar-topic-dot"
                            style={{ opacity: 0.35 + (pct / 100) * 0.65 }}
                          />
                          <span className="sidebar-topic-label">
                            <span className="sidebar-topic-meta">Meta {a.metaNumero}</span>
                            <span className="sidebar-topic-title">{a.assunto}</span>
                          </span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

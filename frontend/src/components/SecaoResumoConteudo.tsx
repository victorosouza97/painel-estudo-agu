import { api, AssuntoDetail } from "../lib/api";
import ProgressBar from "./ProgressBar";

export default function SecaoResumoConteudo({
  assunto,
  onChange,
}: {
  assunto: AssuntoDetail;
  onChange: (patch: Partial<AssuntoDetail>) => void;
}) {
  const rc = assunto.resumoConteudo;
  const inicio = rc?.paginaInicio ?? null;
  const fim = rc?.paginaFim ?? null;
  const ultimaPaginaLida = rc?.ultimaPaginaLida ?? null;

  const paginas: number[] = [];
  if (inicio != null && fim != null && fim >= inicio) {
    for (let p = inicio; p <= fim; p++) paginas.push(p);
  }

  const total = paginas.length;
  const lidas = inicio != null && ultimaPaginaLida != null ? Math.max(0, ultimaPaginaLida - inicio + 1) : 0;

  async function clicarPagina(p: number) {
    const resultado = await api.definirProgressoPagina(assunto.id, p);
    onChange({
      resumoConteudo: { paginaInicio: inicio, paginaFim: fim, ultimaPaginaLida: resultado.ultimaPaginaLida },
    });
  }

  const pdfHref = `/pdfs/${assunto.pdfSemanaArquivo}#page=${inicio ?? 1}`;

  return (
    <section className="secao">
      <h2>
        3. Resumo do Conteúdo{" "}
        {total > 0 && (
          <span className="muted small">
            ({lidas}/{total} páginas)
          </span>
        )}
      </h2>
      {total > 0 && <ProgressBar value={(lidas / total) * 100} />}
      <div className="row-gap">
        <a className="button-link" href={pdfHref} target="_blank" rel="noreferrer">
          Abrir PDF da semana
        </a>
        {inicio != null && (
          <span className="muted">
            Páginas {inicio}
            {fim != null ? `–${fim}` : ""} do material
          </span>
        )}
        {inicio == null && <span className="muted">Intervalo de páginas não identificado.</span>}
      </div>
      {total > 0 && (
        <p className="muted small">Clique numa página para marcar a leitura sequencial até ela.</p>
      )}

      {total > 0 && (
        <div className="page-grid">
          {paginas.map((p) => (
            <button
              key={p}
              className={`page-chip ${ultimaPaginaLida != null && p <= ultimaPaginaLida ? "read" : ""}`}
              onClick={() => clicarPagina(p)}
              title={`Página ${p}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

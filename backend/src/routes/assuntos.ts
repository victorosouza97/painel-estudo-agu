import { Router } from "express";
import { prisma } from "../prisma";

export const assuntosRouter = Router();

function summarize(a: any) {
  const legislacaoTotal = a.legislacaoItens.length;
  const legislacaoConcluida = a.legislacaoItens.filter((x: any) => x.concluido).length;

  const resumoTotal =
    a.paginaInicio != null && a.paginaFim != null
      ? a.paginaFim - a.paginaInicio + 1
      : null;
  const ultimaPaginaLida = a.resumoConteudo?.ultimaPaginaLida ?? null;
  const resumoLidas =
    a.paginaInicio != null && ultimaPaginaLida != null
      ? Math.max(0, ultimaPaginaLida - a.paginaInicio + 1)
      : 0;

  const acertos = a.questoesSessoes.reduce((s: number, q: any) => s + q.acertos, 0);
  const erros = a.questoesSessoes.reduce((s: number, q: any) => s + q.erros, 0);

  return {
    id: a.id,
    semana: a.semana,
    metaNumero: a.metaNumero,
    disciplina: a.disciplina,
    assunto: a.assunto,
    paginaInicio: a.paginaInicio,
    paginaFim: a.paginaFim,
    leituraBase: {
      disponivel: a.leituraBase?.disponivel ?? false,
      nomePdfBase: a.leituraBase?.nomePdfBase ?? null,
      concluido: a.leituraBase?.concluido ?? false,
    },
    legislacaoTotal,
    legislacaoConcluida,
    resumoTotal,
    resumoLidas,
    questoesTotalSessoes: a.questoesSessoes.length,
    questoesAcertos: acertos,
    questoesErros: erros,
  };
}

const FULL_INCLUDE = {
  leituraBase: true,
  resumoConteudo: true,
  questoesFiltro: true,
  legislacaoItens: { orderBy: { ordem: "asc" as const } },
  questoesSessoes: { orderBy: { data: "desc" as const } },
  observacoes: true,
};

assuntosRouter.get("/disciplinas", async (_req, res) => {
  const assuntos = await prisma.assunto.findMany({ include: FULL_INCLUDE });
  const byDisciplina = new Map<string, any[]>();
  for (const a of assuntos) {
    const list = byDisciplina.get(a.disciplina) || [];
    list.push(summarize(a));
    byDisciplina.set(a.disciplina, list);
  }
  const result = Array.from(byDisciplina.entries()).map(([disciplina, itens]) => ({
    disciplina,
    totalAssuntos: itens.length,
  }));
  result.sort((x, y) => x.disciplina.localeCompare(y.disciplina, "pt-BR"));
  res.json(result);
});

assuntosRouter.get("/assuntos", async (req, res) => {
  const { disciplina } = req.query;
  const where = disciplina ? { disciplina: String(disciplina) } : {};
  const assuntos = await prisma.assunto.findMany({
    where,
    include: FULL_INCLUDE,
    orderBy: [{ semanaOrdemNum: "asc" }, { semanaOrdemSuf: "asc" }, { id: "asc" }],
  });
  res.json(assuntos.map(summarize));
});

assuntosRouter.get("/assuntos/:id", async (req, res) => {
  const a = await prisma.assunto.findUnique({
    where: { id: req.params.id },
    include: FULL_INCLUDE,
  });
  if (!a) return res.status(404).json({ error: "not_found" });
  res.json(a);
});

assuntosRouter.patch("/assuntos/:id/leitura-base", async (req, res) => {
  const { concluido } = req.body || {};
  const lb = await prisma.leituraBase.update({
    where: { assuntoId: req.params.id },
    data: { concluido: !!concluido, concluidoEm: concluido ? new Date() : null },
  });
  res.json(lb);
});

assuntosRouter.patch("/assuntos/:id/legislacao/:itemId", async (req, res) => {
  const { concluido } = req.body || {};
  const item = await prisma.legislacaoItem.update({
    where: { id: req.params.itemId },
    data: { concluido: !!concluido },
  });
  res.json(item);
});

assuntosRouter.post("/assuntos/:id/legislacao", async (req, res) => {
  const { texto } = req.body || {};
  if (!texto || typeof texto !== "string") {
    return res.status(400).json({ error: "texto_required" });
  }
  const count = await prisma.legislacaoItem.count({ where: { assuntoId: req.params.id } });
  const item = await prisma.legislacaoItem.create({
    data: { assuntoId: req.params.id, texto, ordem: count },
  });
  res.status(201).json(item);
});

assuntosRouter.delete("/assuntos/:id/legislacao/:itemId", async (req, res) => {
  await prisma.legislacaoItem.delete({ where: { id: req.params.itemId } });
  res.status(204).end();
});

// Clicar numa página reposiciona o marcador de leitura sequencial:
// - página à frente do progresso atual -> avança o marcador até ela (marca tudo até lá)
// - página já lida (<= progresso atual) -> recua o marcador para a página anterior a ela
//   (desmarca ela e todas as posteriores)
assuntosRouter.post("/assuntos/:id/resumo/marcar-ate", async (req, res) => {
  const { pagina } = req.body || {};
  if (typeof pagina !== "number") return res.status(400).json({ error: "pagina_required" });

  const assunto = await prisma.assunto.findUnique({ where: { id: req.params.id } });
  const rc = await prisma.resumoConteudo.findUnique({ where: { assuntoId: req.params.id } });
  if (!assunto || !rc || assunto.paginaInicio == null) return res.status(404).json({ error: "not_found" });

  const atual = rc.ultimaPaginaLida ?? assunto.paginaInicio - 1;
  const jaLida = pagina <= atual;
  const ultimaPaginaLida = jaLida ? pagina - 1 : pagina;
  const clamped = Math.max(ultimaPaginaLida, assunto.paginaInicio - 1);

  const updated = await prisma.resumoConteudo.update({
    where: { assuntoId: req.params.id },
    data: { ultimaPaginaLida: clamped },
  });
  res.json(updated);
});

assuntosRouter.post("/assuntos/:id/questoes", async (req, res) => {
  const { acertos, erros, data } = req.body || {};
  if (typeof acertos !== "number" || typeof erros !== "number") {
    return res.status(400).json({ error: "acertos_erros_required" });
  }
  const sessao = await prisma.questoesSessao.create({
    data: {
      assuntoId: req.params.id,
      acertos,
      erros,
      data: data ? new Date(data) : new Date(),
    },
  });
  res.status(201).json(sessao);
});

assuntosRouter.delete("/questoes/:sessaoId", async (req, res) => {
  await prisma.questoesSessao.delete({ where: { id: req.params.sessaoId } });
  res.status(204).end();
});

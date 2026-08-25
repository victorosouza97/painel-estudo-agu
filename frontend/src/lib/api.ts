export interface AssuntoSummary {
  id: string;
  semana: string;
  metaNumero: string;
  disciplina: string;
  assunto: string;
  paginaInicio: number | null;
  paginaFim: number | null;
  leituraBase: { disponivel: boolean; nomePdfBase: string | null; concluido: boolean };
  legislacaoTotal: number;
  legislacaoConcluida: number;
  resumoTotal: number | null;
  resumoLidas: number;
  questoesTotalSessoes: number;
  questoesAcertos: number;
  questoesErros: number;
}

export interface LegislacaoItem {
  id: string;
  texto: string;
  ordem: number;
  concluido: boolean;
}

export interface QuestoesSessao {
  id: string;
  data: string;
  acertos: number;
  erros: number;
}

export interface AssuntoDetail {
  id: string;
  semana: string;
  metaNumero: string;
  disciplina: string;
  assunto: string;
  pdfSemanaArquivo: string;
  paginaInicio: number | null;
  paginaFim: number | null;
  passoAPassoBruto: string;
  leituraBase: {
    disponivel: boolean;
    nomePdfBase: string | null;
    concluido: boolean;
    concluidoEm: string | null;
  } | null;
  resumoConteudo: { paginaInicio: number | null; paginaFim: number | null; ultimaPaginaLida: number | null } | null;
  questoesFiltro: {
    banca: string | null;
    disciplina: string | null;
    assuntoCodigo: string | null;
    nivel: string | null;
    area: string | null;
    modalidade: string | null;
    quantidadeSugerida: number | null;
  } | null;
  legislacaoItens: LegislacaoItem[];
  questoesSessoes: QuestoesSessao[];
  observacoes: { id: string; texto: string }[];
}

export interface DisciplinaSummary {
  disciplina: string;
  totalAssuntos: number;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TIMEOUT_MS = 15000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError(0, "tempo_esgotado");
    }
    throw new ApiError(0, "falha_de_rede");
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: true }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<{ authed: boolean }>("/auth/me"),

  disciplinas: () => request<DisciplinaSummary[]>("/disciplinas"),
  assuntos: (disciplina: string) =>
    request<AssuntoSummary[]>(`/assuntos?disciplina=${encodeURIComponent(disciplina)}`),
  assuntosTodos: () => request<AssuntoSummary[]>("/assuntos"),
  assunto: (id: string) => request<AssuntoDetail>(`/assuntos/${id}`),

  setLeituraBase: (id: string, concluido: boolean) =>
    request(`/assuntos/${id}/leitura-base`, { method: "PATCH", body: JSON.stringify({ concluido }) }),

  toggleLegislacao: (assuntoId: string, itemId: string, concluido: boolean) =>
    request(`/assuntos/${assuntoId}/legislacao/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ concluido }),
    }),
  addLegislacao: (assuntoId: string, texto: string) =>
    request<LegislacaoItem>(`/assuntos/${assuntoId}/legislacao`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),
  removeLegislacao: (assuntoId: string, itemId: string) =>
    request(`/assuntos/${assuntoId}/legislacao/${itemId}`, { method: "DELETE" }),

  definirProgressoPagina: (assuntoId: string, pagina: number) =>
    request<{ ultimaPaginaLida: number | null }>(`/assuntos/${assuntoId}/resumo/marcar-ate`, {
      method: "POST",
      body: JSON.stringify({ pagina }),
    }),

  addQuestoesSessao: (assuntoId: string, acertos: number, erros: number) =>
    request<QuestoesSessao>(`/assuntos/${assuntoId}/questoes`, {
      method: "POST",
      body: JSON.stringify({ acertos, erros }),
    }),
  removeQuestoesSessao: (sessaoId: string) => request(`/questoes/${sessaoId}`, { method: "DELETE" }),
};

export { ApiError };

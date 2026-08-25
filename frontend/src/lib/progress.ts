import { AssuntoSummary } from "./api";

export interface ProgressInputs {
  leituraBaseDisponivel: boolean;
  leituraBaseConcluido: boolean;
  legislacaoTotal: number;
  legislacaoConcluida: number;
  resumoTotal: number | null;
  resumoLidas: number;
}

// pesos da meta: Leitura Base 50%, Legislação 25%, Resumo do Conteúdo 25%. Questões não conta.
const PESO_LEITURA_BASE = 50;
const PESO_LEGISLACAO = 25;
const PESO_RESUMO = 25;

export function leituraBasePercent(i: ProgressInputs): number | null {
  if (!i.leituraBaseDisponivel) return null;
  return i.leituraBaseConcluido ? 100 : 0;
}

export function legislacaoPercent(i: ProgressInputs): number | null {
  if (i.legislacaoTotal <= 0) return null;
  return (i.legislacaoConcluida / i.legislacaoTotal) * 100;
}

export function resumoPercent(i: ProgressInputs): number | null {
  if (!i.resumoTotal) return null;
  return (i.resumoLidas / i.resumoTotal) * 100;
}

// progresso ponderado da meta: seções que não se aplicam (ex.: sem PDF base indicado, ou sem
// intervalo de páginas identificado) são ignoradas e seu peso é redistribuído entre as demais.
// Nunca arredonda: cada pequeno avanço (ex.: 1 página lida) deve refletir no número.
export function computeProgress(i: ProgressInputs): number {
  const partes: { peso: number; valor: number }[] = [];
  const lb = leituraBasePercent(i);
  if (lb != null) partes.push({ peso: PESO_LEITURA_BASE, valor: lb });
  const lg = legislacaoPercent(i);
  if (lg != null) partes.push({ peso: PESO_LEGISLACAO, valor: lg });
  const rc = resumoPercent(i);
  if (rc != null) partes.push({ peso: PESO_RESUMO, valor: rc });
  if (partes.length === 0) return 0;
  const pesoTotal = partes.reduce((s, p) => s + p.peso, 0);
  const soma = partes.reduce((s, p) => s + p.peso * p.valor, 0);
  return soma / pesoTotal;
}

export function assuntoProgress(a: AssuntoSummary): number {
  return computeProgress({
    leituraBaseDisponivel: a.leituraBase.disponivel,
    leituraBaseConcluido: a.leituraBase.concluido,
    legislacaoTotal: a.legislacaoTotal,
    legislacaoConcluida: a.legislacaoConcluida,
    resumoTotal: a.resumoTotal,
    resumoLidas: a.resumoLidas,
  });
}

export function aproveitamento(acertos: number, erros: number): number | null {
  const total = acertos + erros;
  if (total === 0) return null;
  return (acertos / total) * 100;
}

export interface Aggregate {
  progressoMedio: number;
  totalAcertos: number;
  totalErros: number;
  aproveitamentoPct: number | null;
}

export function aggregateAssuntos(assuntos: AssuntoSummary[]): Aggregate {
  const progressoMedio = assuntos.length
    ? assuntos.reduce((s, a) => s + assuntoProgress(a), 0) / assuntos.length
    : 0;
  const totalAcertos = assuntos.reduce((s, a) => s + a.questoesAcertos, 0);
  const totalErros = assuntos.reduce((s, a) => s + a.questoesErros, 0);
  return { progressoMedio, totalAcertos, totalErros, aproveitamentoPct: aproveitamento(totalAcertos, totalErros) };
}

function trimTrailingZeros(fixed: string): string {
  return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

// Formata percentuais sem nunca arredondar para 0: começa com 2 casas decimais e, se o valor
// ainda "sumir" (ex.: 1 página lida de milhares no total geral), aumenta a precisão até o
// avanço aparecer (até 6 casas). Assim todo pequeno progresso real fica visível.
export function formatPct(value: number): string {
  if (value <= 0) return "0%";
  for (let decimals = 2; decimals <= 6; decimals++) {
    const fixed = value.toFixed(decimals);
    if (parseFloat(fixed) > 0) {
      return `${trimTrailingZeros(fixed)}%`;
    }
  }
  return `${trimTrailingZeros(value.toFixed(6))}%`;
}

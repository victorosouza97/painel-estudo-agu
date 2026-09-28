import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, AssuntoSummary } from "./api";
import { aggregateAssuntos, Aggregate } from "./progress";

interface AssuntosContextValue {
  assuntos: AssuntoSummary[];
  porDisciplina: Map<string, AssuntoSummary[]>;
  disciplinas: string[];
  agregadoTotal: Aggregate;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const AssuntosContext = createContext<AssuntosContextValue | null>(null);

export function AssuntosProvider({ children }: { children: ReactNode }) {
  const [assuntos, setAssuntos] = useState<AssuntoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .assuntosTodos()
      .then((data) => {
        if (cancelled) return;
        setAssuntos(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar os assuntos.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const porDisciplina = useMemo(() => {
    const map = new Map<string, AssuntoSummary[]>();
    for (const a of assuntos) {
      const list = map.get(a.disciplina) || [];
      list.push(a);
      map.set(a.disciplina, list);
    }
    return map;
  }, [assuntos]);

  const disciplinas = useMemo(
    () => Array.from(porDisciplina.keys()).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [porDisciplina]
  );

  const agregadoTotal = useMemo(() => aggregateAssuntos(assuntos), [assuntos]);

  const refetch = useCallback(() => setAttempt((a) => a + 1), []);

  return (
    <AssuntosContext.Provider
      value={{ assuntos, porDisciplina, disciplinas, agregadoTotal, loading, error, refetch }}
    >
      {children}
    </AssuntosContext.Provider>
  );
}

export function useAssuntosContext() {
  const ctx = useContext(AssuntosContext);
  if (!ctx) throw new Error("useAssuntosContext must be used within AssuntosProvider");
  return ctx;
}

import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Sidebar from "./Sidebar";

const PLANILHA_URL =
  "https://docs.google.com/spreadsheets/d/1gh2qAak3tUU-OTSzKlWTKwHYScrMfCTUaHAqQ3IaMh0/edit?usp=sharing";
const TEC_CONCURSOS_URL = "https://www.tecconcursos.com.br/";
const SIDEBAR_STORAGE_KEY = "painel-agu:sidebar-aberta";

function getInitialSidebarState() {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) return saved === "1";
  } catch {
    /* localStorage indisponível — segue com o padrão */
  }
  return typeof window !== "undefined" ? window.innerWidth > 900 : true;
}

export default function Layout({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  const [sidebarAberta, setSidebarAberta] = useState(getInitialSidebarState);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarAberta ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarAberta]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarAberta((v) => !v)}
            aria-label={sidebarAberta ? "Recolher menu" : "Expandir menu"}
            aria-expanded={sidebarAberta}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/" className="brand">
            Painel de Estudo · AGU
          </Link>
        </div>
        <div className="topbar-actions">
          <a className="button-link small ghost" href={PLANILHA_URL} target="_blank" rel="noreferrer">
            Planilha de Estudos
          </a>
          <a className="button-link small ghost" href={TEC_CONCURSOS_URL} target="_blank" rel="noreferrer">
            TEC Concursos
          </a>
          <button
            className="link-button"
            onClick={async () => {
              await api.logout();
              onLogout();
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${sidebarAberta ? "open" : "closed"}`}>
          <Sidebar onNavigate={() => isMobile && setSidebarAberta(false)} />
        </aside>
        {isMobile && sidebarAberta && (
          <div className="sidebar-backdrop" onClick={() => setSidebarAberta(false)} />
        )}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

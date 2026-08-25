import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const PLANILHA_URL =
  "https://docs.google.com/spreadsheets/d/1gh2qAak3tUU-OTSzKlWTKwHYScrMfCTUaHAqQ3IaMh0/edit?usp=sharing";
const TEC_CONCURSOS_URL = "https://www.tecconcursos.com.br/";

export default function Layout({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Painel de Estudo · AGU
        </Link>
        <div className="topbar-actions">
          <a className="button-link small" href={PLANILHA_URL} target="_blank" rel="noreferrer">
            Planilha de Estudos
          </a>
          <a className="button-link small" href={TEC_CONCURSOS_URL} target="_blank" rel="noreferrer">
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
      <main className="content">{children}</main>
    </div>
  );
}

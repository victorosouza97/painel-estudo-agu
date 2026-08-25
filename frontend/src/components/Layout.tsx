import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

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
        <button
          className="link-button"
          onClick={async () => {
            await api.logout();
            onLogout();
          }}
        >
          Sair
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

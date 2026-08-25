import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api } from "./lib/api";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Disciplina from "./pages/Disciplina";
import Assunto from "./pages/Assunto";
import Layout from "./components/Layout";

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .me()
      .then((r) => setAuthed(r.authed))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div className="center-screen">Carregando...</div>;
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <Layout onLogout={() => setAuthed(false)}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/disciplina/:nome" element={<Disciplina />} />
        <Route path="/assunto/:id" element={<Assunto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

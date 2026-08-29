import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTitulo } from "../lib/useTitulo";

// Rota coringa (ver AppRouter, path="*") — sem ela, uma URL errada renderizava o Header/
// BottomNav em volta de uma tela em branco, porque nenhuma <Route> batia (o firebase.json
// reescreve tudo pra index.html, então o servidor nunca chega a devolver um 404 de verdade;
// isso aqui é só a camada de UX/SEO por cima). noindex evita que o Google indexe links
// quebrados como se fossem página de conteúdo.
export function NaoEncontradaPage() {
  useTitulo("Página não encontrada");

  // O index.html já tem <meta name="robots" content="index, follow"> fixo — criar uma
  // segunda tag não sobrepõe a primeira (querySelector/crawlers pegam a que já existe).
  // Sobrescreve o valor da tag original e devolve ao normal ao sair da página.
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (!meta) return;
    const original = meta.content;
    meta.content = "noindex";
    return () => {
      meta.content = original;
    };
  }, []);

  return (
    <main>
      <span className="eyebrow">Erro 404</span>
      <h1>Essa página não existe</h1>
      <p className="text-muted">
        O link que você seguiu pode estar quebrado, ou a página foi movida.
      </p>
      <div className="actions">
        <Link to="/" className="button button--primary">
          Voltar pro início
        </Link>
        <Link to="/advogados" className="button button--secondary">
          Ver advogados
        </Link>
      </div>
    </main>
  );
}

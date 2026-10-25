import { useEffect, useState } from "react";

// Hook compartilhado pro padrão repetido em quase toda tela do app: buscar um recurso na
// API assim que a tela monta, guardar erro/estado de carregamento, e poder recarregar
// depois de uma mutação (aprovar, salvar, remover...) sem reescrever o mesmo
// try/catch em cada ação. `buscar` só precisa retornar uma Promise (ex.: `() =>
// api.get("/admin/advogados")`). `deps` é opcional — só quando a tela precisa buscar de
// novo sozinha ao trocar de parâmetro (ex.: `[uid]` na página de perfil do advogado, pra
// não continuar mostrando o advogado anterior ao navegar pra outro perfil pela mesma
// rota); sem isso, só busca de novo quando `recarregar()` é chamado à mão.
//
// Memória entre telas (25/10/2026): voltar pra uma tela já aberta mostra na hora o que foi
// carregado da última vez e atualiza por trás, sem tela de espera. A chave é a própria
// função `buscar` quando ela é declarada fora do componente (sempre a mesma), ou `chave`
// quando a busca é escrita na hora (ex.: `advogado:${uid}`). Sem nenhuma das duas, não
// guarda nada. A memória é apagada ao sair da conta (ver limparMemoria no AuthContext).
const memoria = new Map();

export function limparMemoria() {
  memoria.clear();
}

export function useCarregar(buscar, deps = [], { chave } = {}) {
  const chaveMemoria = chave ?? (buscar.name ? buscar : null);
  const [dado, setDadoLocal] = useState(() => (chaveMemoria ? (memoria.get(chaveMemoria) ?? null) : null));
  const [erro, setErro] = useState(null);

  function setDado(valor) {
    setDadoLocal((anterior) => {
      const novo = typeof valor === "function" ? valor(anterior) : valor;
      if (chaveMemoria) memoria.set(chaveMemoria, novo);
      return novo;
    });
  }

  async function recarregar() {
    setErro(null);
    try {
      setDado(await buscar());
    } catch (err) {
      setErro(err.message);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Trocou de parâmetro (outro advogado, por exemplo): mostra o que estiver na memória
    // pra esse parâmetro, ou a tela de espera, em vez do dado da tela anterior.
    if (chaveMemoria) setDadoLocal(memoria.get(chaveMemoria) ?? null);
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { dado, setDado, erro, setErro, recarregar };
}

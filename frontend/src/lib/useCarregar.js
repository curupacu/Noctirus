import { useEffect, useState } from "react";

// Hook compartilhado pro padrão repetido em quase toda tela do app: buscar um recurso na
// API assim que a tela monta, guardar erro/estado de carregamento, e poder recarregar
// depois de uma mutação (aprovar, suspender, remover, salvar...) sem reescrever o mesmo
// try/catch em cada ação. `buscar` só precisa retornar uma Promise (ex.: `() =>
// api.get("/admin/advogados")`). `deps` é opcional — só quando a tela precisa buscar de
// novo sozinha ao trocar de parâmetro (ex.: `[uid]` na página de perfil do advogado, pra
// não continuar mostrando o advogado anterior ao navegar pra outro perfil pela mesma
// rota); sem isso, só busca de novo quando `recarregar()` é chamado à mão.
export function useCarregar(buscar, deps = []) {
  const [dado, setDado] = useState(null);
  const [erro, setErro] = useState(null);

  async function recarregar() {
    setErro(null);
    try {
      setDado(await buscar());
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { dado, setDado, erro, setErro, recarregar };
}

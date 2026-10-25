import { useEffect, useState } from "react";
import { ouvirServidorLento } from "../../lib/api";
import { CorujaAnimada } from "../CorujaAnimada/CorujaAnimada";
import "./AvisoServidor.css";

// Dicas que trocam durante a espera longa: a pessoa aprende como a Nocturis funciona
// enquanto o servidor acorda (ideia do usuário, 25/10/2026, a partir da tela do Duolingo).
const DICAS = [
  "A triagem é gratuita: você conta o caso do seu jeito e a gente diz de que área ele é.",
  "O advogado só vê o seu nome depois de aceitar o seu pedido de contato.",
  "Se a área sugerida não fizer sentido, dá pra trocar antes de ver os advogados.",
  "Todo advogado da Nocturis tem a OAB conferida no Cadastro Nacional dos Advogados.",
  "Você pode baixar ou apagar os seus dados quando quiser, em Meus dados.",
  "A Nocturis não presta serviço jurídico: ela classifica o caso e direciona.",
];

// Quando uma resposta do servidor passa de 3 segundos. Se é a primeira da visita (o Render
// grátis acordando, até 1 minuto), cobre a tela com a coruja e as dicas; se não, é só uma
// requisição demorada e aparece o aviso pequeno no topo. Some sozinho quando a resposta chega.
export function AvisoServidor() {
  const [estado, setEstado] = useState({ lento: false, acordando: false });
  const [dica, setDica] = useState(0);

  useEffect(() => ouvirServidorLento((lento, acordando) => setEstado({ lento, acordando })), []);

  useEffect(() => {
    if (!estado.lento || !estado.acordando) return undefined;
    const timer = setInterval(() => setDica((i) => (i + 1) % DICAS.length), 5000);
    return () => clearInterval(timer);
  }, [estado.lento, estado.acordando]);

  if (!estado.lento) return null;
  // Na Home quem chega já lê o topo e os botões sem depender do servidor (só o carrossel de
  // advogados espera): cobrir a tela ali atrapalharia mais do que ajudaria.
  if (window.location.pathname === "/") return null;

  if (estado.acordando) {
    return (
      <div className="acordando" role="status" aria-live="polite">
        <CorujaAnimada />
        <p className="acordando__titulo">Acordando o servidor...</p>
        <p className="acordando__sub">Na primeira visita do dia isso pode levar até um minuto.</p>
        <p className="acordando__dica" key={dica}>
          <span>Você sabia?</span>
          {DICAS[dica]}
        </p>
      </div>
    );
  }

  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      <span className="aviso-servidor__girando" aria-hidden="true" />
      <span>
        <strong>Só mais um instante...</strong>
        <span>O servidor está demorando um pouco pra responder.</span>
      </span>
    </div>
  );
}

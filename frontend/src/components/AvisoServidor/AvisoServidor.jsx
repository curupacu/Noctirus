import { useEffect, useState } from "react";
import { ouvirServidorLento } from "../../lib/api";
import "./AvisoServidor.css";

// Aviso que aparece quando uma resposta do servidor passa de 3 segundos — quase sempre é
// o backend (Render grátis) acordando depois de um tempo parado. Some sozinho quando a
// resposta chega. Sem isso a pessoa via um "Carregando..." parado e achava que travou.
export function AvisoServidor() {
  const [lento, setLento] = useState(false);

  useEffect(() => ouvirServidorLento(setLento), []);

  if (!lento) return null;

  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      <span className="aviso-servidor__girando" aria-hidden="true" />
      <span>
        <strong>Acordando o servidor...</strong>
        <span>Na primeira visita do dia isso pode levar até um minuto.</span>
      </span>
    </div>
  );
}

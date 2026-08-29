import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

// Sininho em tempo real — onSnapshot escuta o Firestore direto (sem polling, sem round-trip
// pela API), liberado pra leitura só do próprio dono via firestore.rules. Quem cria os
// documentos é sempre o backend (Admin SDK, ver services/notificacoes.js); o frontend só lê
// e marca como lida.
export function useNotificacoes(uid) {
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
    if (!uid) {
      setNotificacoes([]);
      return;
    }

    const consulta = query(
      collection(db, "notificacoes"),
      where("destinatarioId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const cancelar = onSnapshot(consulta, (snapshot) => {
      setNotificacoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return cancelar;
  }, [uid]);

  function marcarComoLida(id) {
    updateDoc(doc(db, "notificacoes", id), { lida: true }).catch(() => {});
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return { notificacoes, naoLidas, marcarComoLida };
}

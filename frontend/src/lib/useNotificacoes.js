import { useEffect, useState } from "react";
import { obterFirestore } from "./firebase";

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

    // Firestore é carregado sob demanda (ver lib/firebase.js) — por isso a assinatura é
    // assíncrona e o cancelamento precisa cobrir o caso de sair antes dela ficar pronta.
    let cancelar = () => {};
    let ativo = true;
    (async () => {
      const [{ collection, limit, onSnapshot, orderBy, query, where }, db] = await Promise.all([
        import("firebase/firestore"),
        obterFirestore(),
      ]);
      if (!ativo) return;
      const consulta = query(
        collection(db, "notificacoes"),
        where("destinatarioId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      cancelar = onSnapshot(consulta, (snapshot) => {
        setNotificacoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    })().catch(() => {});

    return () => {
      ativo = false;
      cancelar();
    };
  }, [uid]);

  async function marcarComoLida(id) {
    try {
      const [{ doc, updateDoc }, db] = await Promise.all([import("firebase/firestore"), obterFirestore()]);
      await updateDoc(doc(db, "notificacoes", id), { lida: true });
    } catch {
      // marcar como lida é só conveniência — não quebra nada se falhar
    }
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return { notificacoes, naoLidas, marcarComoLida };
}

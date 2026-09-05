import * as Sentry from "@sentry/react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth } from "../../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // Diagnóstico temporário do bug de sessão sumindo sozinha no mobile (achado do usuário,
  // 29/08) — distingue logout pedido de verdade de o Firebase reportar "sem sessão"
  // sozinho. Remover essa ref e o bloco de Sentry.captureMessage assim que a causa for
  // confirmada.
  const logoutExplicito = useRef(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!logoutExplicito.current) {
          try {
            const dbs = await indexedDB.databases();
            Sentry.captureMessage("diagnostico-sessao: onAuthStateChanged sem usuário", {
              level: "warning",
              extra: {
                indexedDbNomes: dbs.map((d) => d.name),
                temFirebaseDb: dbs.some((d) => d.name?.includes("firebaseLocalStorageDb")),
                userAgent: navigator.userAgent,
                standalone: window.matchMedia("(display-mode: standalone)").matches,
              },
            });
          } catch (err) {
            console.error("Falha no diagnóstico de sessão", err);
          }
        }
        logoutExplicito.current = false;
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      // O Firebase já confirmou que existe sessão salva — marca como logado ANTES de
      // buscar o papel, não depois. O ID token dura só 1h, então reabrir o app depois de
      // um tempo sempre precisa renovar ele por rede; sem isso, uma renovação que falha
      // (rede instável logo ao abrir o app — bem mais comum no celular saindo de "app
      // fechado" do que no PC com wifi já estabilizado) travava em "Carregando..." pra
      // sempre e nunca marcava como logado, parecendo que a sessão tinha sumido de vez
      // (achado do usuário, 29/08: login "some" toda vez que fecha o app no Android).
      setUser(firebaseUser);
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        setRole(tokenResult.claims.role || null);
      } catch (err) {
        console.error("Falha ao renovar o token de sessão", err);
      }
      setLoading(false);
    });
  }, []);

  async function cadastrar(email, senha) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    return credencial.user;
  }

  async function login(email, senha) {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    const tokenResult = await credencial.user.getIdTokenResult();
    const roleLogado = tokenResult.claims.role || null;
    setRole(roleLogado);
    return roleLogado;
  }

  // Login e cadastro com Google usam o mesmo método do Firebase — pra conta nova, o
  // signInWithPopup já cria o usuário na Auth sozinho (não existe "conta não encontrada"
  // com provider federado). Por isso role vem null pra quem é novo: quem chamou decide se
  // manda pra dentro do app (role existe) ou pra completar o cadastro (role null).
  async function loginComGoogle() {
    const provider = new GoogleAuthProvider();
    const credencial = await signInWithPopup(auth, provider);
    const tokenResult = await credencial.user.getIdTokenResult();
    const roleLogado = tokenResult.claims.role || null;
    setRole(roleLogado);
    return { user: credencial.user, role: roleLogado };
  }

  async function logout() {
    logoutExplicito.current = true;
    await signOut(auth);
  }

  async function atualizarRole() {
    if (!auth.currentUser) return null;
    const tokenResult = await auth.currentUser.getIdTokenResult(true);
    const novoRole = tokenResult.claims.role || null;
    setRole(novoRole);
    return novoRole;
  }

  return (
    <AuthContext.Provider
      value={{ user, role, loading, cadastrar, login, loginComGoogle, logout, atualizarRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

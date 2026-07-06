import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      const tokenResult = await firebaseUser.getIdTokenResult();
      setUser(firebaseUser);
      setRole(tokenResult.claims.role || null);
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

  async function logout() {
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
      value={{ user, role, loading, cadastrar, login, logout, atualizarRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

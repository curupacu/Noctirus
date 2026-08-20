import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// O backend (Render, plano grátis) "hiberna" depois de inatividade — a primeira
// requisição depois disso pode não achar o servidor de pé ainda e o fetch falha de
// verdade (TypeError "Failed to fetch"), não é um erro HTTP normal (achado ao vivo,
// 20/08: usuário via a página quebrada até dar refresh manual, porque nessa hora o
// servidor já tinha acordado). Só GET tenta de novo sozinho — escrita (POST/PATCH/etc.)
// não, pra não arriscar duplicar uma ação se o servidor tiver recebido mas a resposta
// não voltou a tempo.
async function fetchComRetry(url, opcoes, { retryGet = false } = {}) {
  try {
    return await fetch(url, opcoes);
  } catch (erro) {
    if (!retryGet) throw erro;
    await esperar(1500);
    return fetch(url, opcoes);
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchComRetry(
    `${API_URL}${path}`,
    { method, headers, body: body ? JSON.stringify(body) : undefined },
    { retryGet: method === "GET" },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erro || "Erro na requisição");
  }
  return data;
}

// Upload de arquivo (multipart) — sem Content-Type manual de propósito: o browser
// monta o header com o boundary certo sozinho quando o body é um FormData.
async function requestUpload(path, formData) {
  const headers = {};

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erro || "Erro na requisição");
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => requestUpload(path, formData),
};

import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// O backend (Render, plano grátis) "hiberna" depois de inatividade — a primeira
// requisição depois disso pode levar até ~1 minuto, ou falhar de verdade (TypeError
// "Failed to fetch") / voltar 502-503 enquanto o servidor sobe (achado ao vivo, 20/08 e
// 13/10). Só GET tenta de novo sozinho — escrita (POST/PATCH/etc.) não, pra não arriscar
// duplicar uma ação se o servidor tiver recebido mas a resposta não voltou a tempo.
const ESPERAS_RETRY = [2000, 4000, 8000];
const STATUS_ACORDANDO = [502, 503, 504];

async function fetchComRetry(url, opcoes, { retryGet = false } = {}) {
  for (let tentativa = 0; ; tentativa += 1) {
    const ultima = !retryGet || tentativa >= ESPERAS_RETRY.length;
    try {
      const res = await fetch(url, opcoes);
      if (ultima || !STATUS_ACORDANDO.includes(res.status)) return res;
    } catch (erro) {
      if (ultima) throw erro;
    }
    await esperar(ESPERAS_RETRY[tentativa]);
  }
}

// Aviso de "servidor acordando": se uma requisição passa de 3 s, avisa quem estiver
// ouvindo (componente AvisoServidor) até ela terminar.
// `acordando` = nenhuma resposta chegou ainda nesta visita, ou seja, o servidor está saindo
// do modo de espera do Render. Aí o aviso vira a tela da coruja; depois disso, lentidão é só
// uma requisição demorada (a IA da triagem, por exemplo) e o aviso fica pequeno.
const ouvintesLentidao = new Set();
let lentas = 0;
let servidorJaRespondeu = false;

function avisarLentidao() {
  ouvintesLentidao.forEach((fn) => fn(lentas > 0, !servidorJaRespondeu));
}

export function ouvirServidorLento(fn) {
  ouvintesLentidao.add(fn);
  return () => ouvintesLentidao.delete(fn);
}

const ERRO_CONEXAO = "Não conseguimos falar com o servidor. Confira sua internet e tente de novo em instantes.";

async function medindoLentidao(promessa) {
  let ficouLenta = false;
  const timer = setTimeout(() => {
    ficouLenta = true;
    lentas += 1;
    avisarLentidao();
  }, 3000);
  try {
    const resposta = await promessa;
    servidorJaRespondeu = true;
    return resposta;
  } catch (erro) {
    // Falha de rede (servidor fora ou sem internet): o "Failed to fetch" do navegador não
    // diz nada pra quem usa — troca por uma mensagem em português.
    if (erro instanceof TypeError) throw new Error(ERRO_CONEXAO);
    throw erro;
  } finally {
    clearTimeout(timer);
    if (ficouLenta) {
      lentas -= 1;
      avisarLentidao();
    }
  }
}

// Chamado assim que o app abre: cutuca o backend pra ele já ir acordando enquanto a
// pessoa ainda está na Home ou no login. Silencioso — não mostra aviso nem erro.
export function acordarServidor() {
  fetch(`${API_URL}/health`).catch(() => {});
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await medindoLentidao(
    fetchComRetry(
      `${API_URL}${path}`,
      { method, headers, body: body ? JSON.stringify(body) : undefined },
      { retryGet: method === "GET" },
    ),
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

  const res = await medindoLentidao(fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData }));

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

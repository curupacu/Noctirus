import { auth } from "../lib/firebase-admin.js";

export async function verificarToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Token de autenticação ausente" });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || null,
    };
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// Igual a verificarToken, mas nunca bloqueia — usado em rotas públicas que se comportam
// diferente quando o cliente está logado (ex.: POST /advogados/:uid/contato passa a
// rastrear qual cliente contatou qual advogado, só quando há token válido), sem exigir
// login pra continuar funcionando pra quem navega anônimo.
export async function tentarVerificarToken(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next();

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || null,
    };
  } catch {
    // Token inválido/expirado — segue anônimo em vez de bloquear.
  }
  next();
}

export function requireRole(...papeis) {
  return (req, res, next) => {
    if (!req.user || !papeis.includes(req.user.role)) {
      return res.status(403).json({ erro: "Sem permissão para esta operação" });
    }
    next();
  };
}

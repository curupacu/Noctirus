// Middleware genérico de validação de entrada com Zod. Antes, cada rota validava campo
// por campo à mão (ou nem validava) — sem tipo, tamanho ou formato garantidos, dava pra
// mandar `nome: 12345`, um array gigante em curriculo ou um texto sem limite de tamanho.
export function validarBody(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const primeiro = resultado.error.issues[0];
      return res.status(400).json({
        erro: `Campo '${primeiro.path.join(".") || "corpo"}': ${primeiro.message}`,
      });
    }
    req.body = resultado.data;
    next();
  };
}

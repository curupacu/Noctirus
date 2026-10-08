import { z } from "zod";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Cidade + UF de cliente e advogado (RF002/RF003). Obrigatório no cadastro dos dois: sem
// isso o filtro por região do resultado da triagem (RF008) não tem com o que comparar.
export const schemaLocalizacao = z.object({
  cidade: z.string().trim().min(2, "Informe sua cidade").max(100),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((uf) => UFS.includes(uf), "UF inválida"),
});

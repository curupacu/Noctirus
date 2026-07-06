export function rotaInicial(role) {
  if (role === "admin") return "/admin/advogados";
  if (role === "advogado") return "/perfil";
  return "/painel";
}

import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/admin/advogados", label: "OAB" },
  { to: "/admin/usuarios", label: "Usuários" },
  { to: "/admin/denuncias", label: "Denúncias" },
];

export function AdminNav() {
  return (
    <nav className="pill-toggle">
      {ITENS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `pill-toggle__item${isActive ? " pill-toggle__item--active" : ""}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

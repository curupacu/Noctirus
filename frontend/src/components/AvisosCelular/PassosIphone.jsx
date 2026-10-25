function IconeCompartilhar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// No iPhone não existe botão de instalar: a pessoa faz pelo menu do Safari.
export function PassosIphone() {
  return (
    <ol className="passos-iphone">
      <li>
        Toque em <strong>Compartilhar</strong>{" "}
        <span className="passos-iphone__icone">
          <IconeCompartilhar />
        </span>{" "}
        na barra do Safari.
      </li>
      <li>
        Escolha <strong>Adicionar à Tela de Início</strong>.
      </li>
      <li>Abra a Nocturis pelo ícone novo na tela do celular.</li>
    </ol>
  );
}

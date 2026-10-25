import "./Esqueleto.css";

// Telas de espera em forma de "esqueleto" (25/10/2026, referência do Facebook): enquanto os
// dados chegam, a tela já aparece montada com blocos bege no lugar de cartões, fotos e
// textos. A pessoa vê onde cada coisa vai aparecer e a espera parece mais curta do que a
// coruja com "Carregando...". A coruja grande fica só pra espera longa (AvisoServidor).

function Osso({ w = "100%", h = 14, r = 8, className = "" }) {
  return <span className={`osso ${className}`.trim()} style={{ width: w, height: h, borderRadius: r }} />;
}

function Esqueleto({ className, children }) {
  return (
    <main className={`esqueleto ${className || ""}`.trim()} role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Carregando...</span>
      {children}
    </main>
  );
}

function Titulo({ largura = "40%" }) {
  return (
    <div className="esqueleto__titulo">
      <Osso w={120} h={14} />
      <Osso w={largura} h={36} r={10} />
    </div>
  );
}

function Prateleira({ itens = 5 }) {
  return (
    <div className="esqueleto__prateleira">
      {Array.from({ length: itens }, (_, i) => (
        <div key={i} className="esqueleto__cartao">
          <Osso h={150} r={14} />
          <Osso w="80%" h={16} />
          <Osso w="55%" h={12} />
        </div>
      ))}
    </div>
  );
}

function Grade({ itens = 3, altura = 150 }) {
  return (
    <div className="esqueleto__grade">
      {Array.from({ length: itens }, (_, i) => (
        <div key={i} className="esqueleto__bloco" style={{ minHeight: altura }}>
          <Osso w="45%" h={12} />
          <Osso w="75%" h={22} r={10} />
          <Osso w="60%" h={14} />
        </div>
      ))}
    </div>
  );
}

// Painel do cliente: destaque, vitrine de advogados, pedidos e triagens.
export function EsqueletoPainel() {
  return (
    <Esqueleto className="painel">
      <Titulo />
      <Osso h={260} r={28} className="esqueleto__destaque" />
      <Osso w="35%" h={28} r={10} className="esqueleto__secao" />
      <Prateleira />
      <Osso w="30%" h={28} r={10} className="esqueleto__secao" />
      <Grade />
    </Esqueleto>
  );
}

// Painel do advogado: destaque, números e atalhos.
export function EsqueletoPainelAdvogado() {
  return (
    <Esqueleto className="painel">
      <Titulo largura="50%" />
      <Osso h={240} r={28} className="esqueleto__destaque" />
      <Grade itens={3} altura={96} />
      <Osso w="25%" h={28} r={10} className="esqueleto__secao" />
      <Grade itens={4} altura={190} />
    </Esqueleto>
  );
}

// Quadro de casos: título, três números e três colunas.
export function EsqueletoQuadro() {
  return (
    <Esqueleto className="quadro">
      <div className="esqueleto__linha">
        <Osso w={220} h={40} r={10} />
        <div className="esqueleto__linha esqueleto__linha--fim">
          <Osso w={170} h={48} r={18} />
          <Osso w={150} h={48} r={18} />
          <Osso w={130} h={48} r={18} />
        </div>
      </div>
      <div className="esqueleto__colunas">
        {[3, 2, 3].map((qtd, c) => (
          <div key={c} className="esqueleto__coluna">
            <Osso h={56} r={0} className="esqueleto__coluna-cabeca" />
            {Array.from({ length: qtd }, (_, i) => (
              <div key={i} className="esqueleto__bloco">
                <Osso w="70%" h={12} />
                <div className="esqueleto__linha">
                  <Osso w={44} h={44} r={22} />
                  <div className="esqueleto__pilha">
                    <Osso w="80%" h={18} />
                    <Osso w="50%" h={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Esqueleto>
  );
}

// Perfil público do advogado: foto, nome, texto e blocos.
export function EsqueletoPerfil() {
  return (
    <Esqueleto>
      <Osso w={90} h={14} />
      <div className="esqueleto__linha esqueleto__perfil">
        <Osso w={120} h={120} r={60} />
        <div className="esqueleto__pilha">
          <Osso w="60%" h={32} r={10} />
          <Osso w="40%" h={14} />
          <Osso w="30%" h={14} />
        </div>
      </div>
      <Osso h={14} />
      <Osso w="90%" h={14} />
      <Osso w="70%" h={14} />
      <Grade itens={2} altura={120} />
    </Esqueleto>
  );
}

// Telas de lista e formulário (pedidos, triagens, admin, cartão...).
export function EsqueletoPagina() {
  return (
    <Esqueleto>
      <Titulo />
      <Grade itens={4} altura={110} />
    </Esqueleto>
  );
}

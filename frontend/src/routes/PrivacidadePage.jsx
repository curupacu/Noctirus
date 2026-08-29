import { Link } from "react-router-dom";
import { useTitulo } from "../lib/useTitulo";

// Política de privacidade (LGPD, Lei 13.709/18) — pública, sem exigir login, linkada no
// checkbox de consentimento do cadastro (ver CadastroPage). Escrita em termos simples de
// propósito: o público da Nocturis não é jurídico especializado em proteção de dados.
export function PrivacidadePage() {
  useTitulo("Política de privacidade");

  return (
    <main>
      <span className="eyebrow">Nocturis</span>
      <h1>Política de privacidade</h1>
      <p className="text-muted">Última atualização: agosto de 2026.</p>

      <div className="section-heading">
        <h2>Quais dados coletamos</h2>
      </div>
      <p>
        Ao criar uma conta, guardamos nome, e-mail e telefone. Se você se cadastra como
        advogado, também guardamos número da OAB, áreas de atuação, localização, contato de
        WhatsApp e o que você preencher no currículo. Se você usa a triagem, guardamos a
        descrição do seu caso e as respostas que você der.
      </p>

      <div className="section-heading">
        <h2>Para que usamos</h2>
      </div>
      <ul className="list-plain">
        <li>Autenticar seu login e mostrar seus próprios dados de volta pra você;</li>
        <li>Classificar sua triagem (área do direito, advogados compatíveis);</li>
        <li>Mostrar seu perfil público, se você for advogado;</li>
        <li>Avisar por e-mail quando um advogado responde uma conversa;</li>
        <li>Moderar a plataforma (denúncias, suspensão de contas problemáticas).</li>
      </ul>

      <div className="section-heading">
        <h2>Com quem compartilhamos</h2>
      </div>
      <p>
        Não vendemos nem compartilhamos seus dados com anunciantes. Usamos alguns serviços de
        terceiros pra a plataforma funcionar, cada um só com o que precisa pra fazer sua parte:
      </p>
      <ul className="list-plain">
        <li>
          <strong>Firebase (Google)</strong> — login e banco de dados;
        </li>
        <li>
          <strong>Google Gemini e Groq</strong> — classificam a descrição do seu caso na
          triagem. Hoje isso roda em camada gratuita das duas plataformas: se você não digitar
          nada de identificável na descrição (nome, CPF, endereço), o risco é baixo, mas é bom
          saber. Migrar pra um plano pago que não usa os dados pra treinar modelo é um item
          já planejado pra quando a Nocturis deixar de ser só um projeto de estudo;
        </li>
        <li>
          <strong>Cloudinary</strong> — guarda a foto de perfil de advogados que fazem upload;
        </li>
        <li>
          <strong>Resend</strong> — envia o e-mail de notificação de resposta no chat;
        </li>
        <li>
          <strong>Google Analytics</strong> — mede quantas pessoas visitam o site e quais
          páginas usam, de forma agregada (não associamos isso ao seu nome ou e-mail).
        </li>
      </ul>

      <div className="section-heading">
        <h2>Seus direitos</h2>
      </div>
      <p>
        Você pode baixar uma cópia de tudo que temos sobre você ou apagar sua conta a qualquer
        momento, direto pela plataforma, sem precisar pedir pra ninguém — veja em{" "}
        <Link to="/perfil">Meu perfil → Meus dados</Link> depois de entrar na sua conta.
        Apagar a conta remove seu cadastro e, se você for advogado, seu perfil público e
        currículo. Mensagens de chat, feedback e denúncias que envolvem outra pessoa não são
        apagados junto, porque também são registro do outro lado da conversa/moderação.
      </p>

      <div className="section-heading">
        <h2>Contato</h2>
      </div>
      <p className="text-muted">
        Dúvida sobre seus dados? Fale com a gente pelo{" "}
        <a href="mailto:aggremtec@gmail.com">aggremtec@gmail.com</a>.
      </p>
    </main>
  );
}

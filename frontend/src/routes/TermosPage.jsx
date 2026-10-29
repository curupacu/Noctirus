import { Link } from "react-router-dom";
import { useTitulo } from "../lib/useTitulo";

// Termos de uso (28/10/2026): pública, sem login, no mesmo formato da política de
// privacidade e linkada junto com ela no cadastro, no rodapé da Home e nas Configurações.
// Escrita em linguagem simples, como a política.
export function TermosPage() {
  useTitulo("Termos de uso");

  return (
    <main>
      <span className="eyebrow">Nocturis</span>
      <h1>Termos de uso</h1>
      <p className="text-muted">Última atualização: outubro de 2026.</p>

      <div className="section-heading">
        <h2>O que é a Nocturis</h2>
      </div>
      <p>
        A Nocturis é uma plataforma de triagem e direcionamento jurídico. Você conta o que
        aconteceu, a gente identifica a área do direito do seu caso e mostra os advogados mais
        compatíveis com ele, perto de você. A Nocturis não presta serviços jurídicos, não dá
        parecer e não substitui a consulta com um advogado.
      </p>
      <p>
        A Nocturis é um projeto acadêmico, desenvolvido pela Aggrem como Trabalho de Conclusão
        de Curso, e é gratuita pra clientes e advogados.
      </p>

      <div className="section-heading">
        <h2>Sobre a triagem</h2>
      </div>
      <p>
        A triagem é feita de forma automática, por inteligência artificial ou por regras, a
        partir do que você escreve. Ela serve pra orientar, não é uma análise jurídica e pode
        errar. Se o assunto identificado não combinar com o seu caso, dá pra ajustar na própria
        tela do resultado ou fazer uma nova triagem.
      </p>

      <div className="section-heading">
        <h2>Sua conta</h2>
      </div>
      <ul className="list-plain">
        <li>Use informações verdadeiras no cadastro e mantenha seus dados atualizados;</li>
        <li>A conta é pessoal: não compartilhe sua senha com ninguém;</li>
        <li>Você responde pelo que fizer com a sua conta;</li>
        <li>
          Você pode apagar sua conta quando quiser, em Configurações, na parte de Privacidade e
          dados.
        </li>
      </ul>

      <div className="section-heading">
        <h2>Para clientes</h2>
      </div>
      <ul className="list-plain">
        <li>
          Descreva o seu caso sem colocar dados que não são necessários, como CPF, endereço
          completo ou informações de outras pessoas;
        </li>
        <li>
          Ao pedir contato, o advogado vê a sua triagem. Seu WhatsApp e seu e-mail só são
          mostrados pra ele depois que ele aceita o pedido;
        </li>
        <li>
          A escolha do advogado e a contratação são decisões suas, combinadas diretamente com
          ele. A Nocturis não participa do acordo nem cobra nada por isso.
        </li>
      </ul>

      <div className="section-heading">
        <h2>Para advogados</h2>
      </div>
      <ul className="list-plain">
        <li>
          Só aparece pros clientes quem tem a inscrição na OAB conferida pela nossa equipe no
          Cadastro Nacional dos Advogados. A aprovação pode ser revogada se a inscrição deixar
          de estar regular;
        </li>
        <li>
          As informações do perfil (formação, áreas de atuação, currículo e contatos) são de
          responsabilidade de quem as preenche e precisam ser verdadeiras;
        </li>
        <li>
          O atendimento, os honorários e a relação com o cliente seguem o Código de Ética e
          Disciplina da OAB e são de responsabilidade do advogado;
        </li>
        <li>
          A Nocturis não vende destaque nem posição: a ordem dos advogados é definida pela
          compatibilidade com o caso e pela proximidade do cliente.
        </li>
      </ul>

      <div className="section-heading">
        <h2>O que não é permitido</h2>
      </div>
      <ul className="list-plain">
        <li>Criar conta com dados falsos ou se passar por outra pessoa;</li>
        <li>Usar a plataforma pra enviar propaganda, ofensas ou conteúdo ilegal;</li>
        <li>Tentar acessar dados de outras pessoas ou atrapalhar o funcionamento do site.</li>
      </ul>
      <p>Contas que fizerem isso podem ser suspensas ou apagadas.</p>

      <div className="section-heading">
        <h2>Disponibilidade</h2>
      </div>
      <p>
        Por ser um projeto acadêmico, a Nocturis roda em serviços gratuitos e pode ficar fora
        do ar ou mais lenta em alguns momentos. Fazemos o possível pra manter tudo
        funcionando, mas não garantimos que o site vai estar disponível o tempo todo.
      </p>

      <div className="section-heading">
        <h2>Seus dados</h2>
      </div>
      <p>
        Como guardamos e usamos os seus dados está explicado na{" "}
        <Link to="/privacidade">política de privacidade</Link>.
      </p>

      <div className="section-heading">
        <h2>Mudanças nestes termos</h2>
      </div>
      <p>
        Estes termos podem ser atualizados. Quando isso acontecer, a data no topo da página
        muda. Continuar usando a Nocturis depois disso significa que você concorda com a
        versão nova.
      </p>

      <div className="section-heading">
        <h2>Contato</h2>
      </div>
      <p className="text-muted">
        Dúvida sobre estes termos? Fale com a gente pelo{" "}
        <a href="mailto:aggremtec@gmail.com">aggremtec@gmail.com</a>.
      </p>
    </main>
  );
}

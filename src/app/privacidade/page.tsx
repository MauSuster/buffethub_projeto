import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Database, FileText, Handshake, Lock, Scale, ShieldCheck, Target, UserCheck, type LucideIcon } from "lucide-react";
import { Alerta } from "@/components/ui/basicos";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o BuffetHub coleta, usa e protege os seus dados pessoais, conforme a LGPD.",
};

type Secao = { id: string; Icone: LucideIcon; titulo: string; conteudo: React.ReactNode };

const SECOES: Secao[] = [
  {
    id: "dados",
    Icone: Database,
    titulo: "Quais dados coletamos",
    conteudo: (
      <ul>
        <li>
          <strong>Dados da conta:</strong> nome, e-mail, telefone e senha (guardada de forma criptografada). Clientes
          informam o CPF; buffets informam o CNPJ e o nome fantasia.
        </li>
        <li>
          <strong>Dados do evento:</strong> tipo, data, local, número de convidados, serviços desejados e observações
          enviadas nos pedidos de orçamento.
        </li>
        <li>
          <strong>Negociação:</strong> propostas, contratos, assinatura digital, registros de pagamento, avaliações e
          mensagens trocadas na plataforma.
        </li>
        <li>
          <strong>Preferências:</strong> o que você escrever no seu perfil (tipo de evento, região, faixa de preço e
          estilo de culinária).
        </li>
      </ul>
    ),
  },
  {
    id: "uso",
    Icone: Target,
    titulo: "Para que usamos",
    conteudo: (
      <ul>
        <li>Criar e proteger a sua conta e permitir o login.</li>
        <li>Levar o seu pedido de orçamento ao buffet escolhido e mostrar a proposta para você.</li>
        <li>Gerar o contrato, conferir a assinatura e registrar o pagamento.</li>
        <li>Enviar avisos sobre o andamento das negociações e o link de recuperação de senha.</li>
        <li>Mostrar avaliações públicas dos buffets, que ajudam outros clientes a escolher.</li>
      </ul>
    ),
  },
  {
    id: "compartilhamento",
    Icone: Handshake,
    titulo: "Com quem compartilhamos",
    conteudo: (
      <>
        <p>
          Não vendemos nem alugamos os seus dados. O buffet só vê o seu nome, contato e dados do evento quando você pede
          um orçamento a ele ou conversa com ele. O seu CPF não aparece para os buffets. Nas avaliações aparece apenas
          o seu primeiro nome com a inicial do sobrenome.
        </p>
        <p>
          Os dados ficam guardados no Supabase (banco de dados e autenticação) e o site é hospedado na Vercel,
          serviços que seguem padrões de segurança de mercado.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    Icone: Lock,
    titulo: "Como protegemos",
    conteudo: (
      <ul>
        <li>Conexão criptografada (HTTPS) em todas as páginas.</li>
        <li>Senhas guardadas com criptografia: nem a equipe consegue lê-las.</li>
        <li>Regras de acesso no banco de dados: cada usuário só enxerga as próprias negociações e mensagens.</li>
        <li>O número completo do cartão não é guardado. Os pagamentos desta versão são simulados.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    Icone: Cookie,
    titulo: "Cookies",
    conteudo: (
      <p>
        Usamos apenas cookies essenciais, que mantêm você conectado à sua conta. Não usamos cookies de publicidade nem
        de rastreamento.
      </p>
    ),
  },
  {
    id: "direitos",
    Icone: UserCheck,
    titulo: "Seus direitos (LGPD, art. 18)",
    conteudo: (
      <>
        <p>Você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
          <li>
            corrigir dados incompletos ou desatualizados (clientes podem fazer isso em{" "}
            <Link href="/cliente/perfil">Meu perfil</Link>);
          </li>
          <li>pedir a portabilidade, a anonimização ou a exclusão dos dados;</li>
          <li>revogar o consentimento, sabendo que sem os dados da conta não é possível usar a plataforma.</li>
        </ul>
        <p>
          Guardamos os dados enquanto a conta existir ou pelo tempo exigido por lei (por exemplo, registros de contratos
          e pagamentos).
        </p>
      </>
    ),
  },
  {
    id: "termos",
    Icone: FileText,
    titulo: "Termos de uso",
    conteudo: (
      <ul>
        <li>Informe dados verdadeiros no cadastro e mantenha a sua senha em segredo.</li>
        <li>Cada buffet é responsável pelas informações, preços e serviços que oferece.</li>
        <li>Propostas aceitas viram contrato entre cliente e buffet; o BuffetHub organiza a negociação.</li>
        <li>Não é permitido usar a plataforma para enviar mensagens ofensivas, falsas ou de propaganda.</li>
      </ul>
    ),
  },
  {
    id: "contato",
    Icone: Scale,
    titulo: "Responsável e contato",
    conteudo: (
      <p>
        O BuffetHub é um projeto acadêmico do curso de Ciência da Computação da FECAP, desenvolvido pelo grupo
        CTRL+ALT+DEL. Dúvidas sobre esta política ou pedidos sobre os seus dados podem ser feitos diretamente ao grupo
        responsável pelo projeto.
      </p>
    ),
  },
];

export default function PaginaPrivacidade() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="hero-gradient relative overflow-hidden rounded-[1.75rem] px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
          <ShieldCheck className="size-3.5 text-accent-300" />
          LGPD · Lei 13.709/2018
        </span>
        <h1 className="relative mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Política de Privacidade e Termos de Uso</h1>
        <p className="relative mt-3 max-w-2xl text-brand-100">
          Explicamos de forma simples quais dados o BuffetHub usa, por que usa e como você controla essas informações.
        </p>
        <p className="relative mt-6 text-xs font-medium text-brand-200">Última atualização: novembro de 2026</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Nesta página" className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Nesta página</p>
            <ul className="space-y-1">
              {SECOES.map(({ id, titulo, Icone }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                  >
                    <Icone className="size-4 text-slate-400" />
                    {titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-5">
          <Alerta tipo="info">
            Este é um projeto acadêmico: os pagamentos são simulados e nenhum valor é cobrado de verdade.
          </Alerta>
          {SECOES.map(({ id, Icone, titulo, conteudo }) => (
            <section key={id} id={id} className="card scroll-mt-24 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icone className="size-5" />
                </span>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">{titulo}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 [&_a]:font-semibold [&_a]:text-brand-700 [&_a:hover]:underline [&_li]:pl-1 [&_strong]:text-slate-800 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {conteudo}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

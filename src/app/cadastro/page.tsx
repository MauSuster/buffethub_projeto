import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartyPopper, ShieldCheck, Store } from "lucide-react";
import { areaInicial, obterSessao } from "@/lib/auth";
import { destinoSeguro } from "@/components/conta/destino";
import { FormCadastro } from "@/components/conta/form-cadastro";
import { LayoutAutenticacao } from "@/components/conta/layout-autenticacao";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta grátis no BuffetHub como cliente ou como buffet.",
};

const DESTAQUES = [
  {
    Icone: PartyPopper,
    titulo: "Para quem organiza o evento",
    texto: "Compare buffets, peça orçamentos e contrate tudo on-line.",
  },
  {
    Icone: Store,
    titulo: "Para buffets",
    texto: "Receba pedidos de orçamento, envie propostas e controle sua agenda.",
  },
  {
    Icone: ShieldCheck,
    titulo: "Seus dados protegidos",
    texto: "Seguimos a LGPD: cada usuário só vê o que é dele.",
  },
];

type Busca = { tipo?: string | string[]; next?: string | string[] };

// T1.0 Cadastro (UC01)
export default async function PaginaCadastro(props: { searchParams: Promise<Busca> }) {
  const busca = await props.searchParams;
  const next = destinoSeguro(busca.next) ?? undefined;

  const sessao = await obterSessao();
  if (sessao) redirect(next ?? areaInicial(sessao.tipo));

  return (
    <LayoutAutenticacao
      largo
      titulo="Cadastre-se grátis"
      texto="Uma conta para encontrar o buffet perfeito ou para levar o seu buffet a novos clientes."
      destaques={DESTAQUES}
    >
      <FormCadastro tipoInicial={busca.tipo === "buffet" ? "buffet" : "cliente"} next={next} />
    </LayoutAutenticacao>
  );
}

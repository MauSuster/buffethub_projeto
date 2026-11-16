import { exigirBuffet } from "@/lib/auth";
import { LayoutPainel, type ItemMenu } from "@/components/layout/painel";

const ITENS: ItemMenu[] = [
  { href: "/anfitriao", rotulo: "Início", icone: "inicio" },
  { href: "/anfitriao/solicitacoes", rotulo: "Solicitações de orçamento", icone: "pedidos", codigo: "T8.4" },
  { href: "/anfitriao/cardapio", rotulo: "Cardápio e preços", icone: "cardapio", codigo: "T8.2" },
  { href: "/anfitriao/calendario", rotulo: "Calendário", icone: "calendario", codigo: "T8.3" },
  { href: "/anfitriao/dados", rotulo: "Dados do buffet", icone: "dados", codigo: "T8.1" },
  { href: "/anfitriao/mensagens", rotulo: "Mensagens", icone: "mensagens", codigo: "T8.5" },
];

// T8.0 Painel do Anfitrião
export default async function LayoutAnfitriao({ children }: { children: React.ReactNode }) {
  await exigirBuffet();
  return (
    <LayoutPainel titulo="Painel do anfitrião" itens={ITENS}>
      {children}
    </LayoutPainel>
  );
}

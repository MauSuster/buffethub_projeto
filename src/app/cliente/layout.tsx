import { exigirCliente } from "@/lib/auth";
import { LayoutPainel, type ItemMenu } from "@/components/layout/painel";

const ITENS: ItemMenu[] = [
  { href: "/cliente", rotulo: "Início", icone: "inicio" },
  { href: "/cliente/solicitacoes", rotulo: "Solicitações e propostas", icone: "solicitacoes", codigo: "T7.1" },
  { href: "/cliente/contratos", rotulo: "Meus contratos", icone: "contratos", codigo: "T7.2" },
  { href: "/cliente/reservas", rotulo: "Minhas reservas", icone: "reservas", codigo: "T7.3" },
  { href: "/cliente/mensagens", rotulo: "Mensagens", icone: "mensagens", codigo: "T7.4" },
  { href: "/cliente/perfil", rotulo: "Meu perfil", icone: "perfil", codigo: "T7.5" },
];

// T7.0 Painel do Cliente
export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  await exigirCliente();
  return (
    <LayoutPainel titulo="Minha área" itens={ITENS}>
      {children}
    </LayoutPainel>
  );
}

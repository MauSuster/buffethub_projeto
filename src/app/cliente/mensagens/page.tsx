import type { Metadata } from "next";
import { exigirCliente } from "@/lib/auth";
import { PaginaMensagens } from "@/components/mensagens/pagina-mensagens";

export const metadata: Metadata = { title: "Mensagens" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// T7.4 Mensagens (UC03)
export default async function MensagensCliente({ searchParams }: Props) {
  const { com } = await searchParams;
  const idConversa = typeof com === "string" && com ? com : undefined;
  const sessao = await exigirCliente(idConversa ? `/cliente/mensagens?com=${encodeURIComponent(idConversa)}` : "/cliente/mensagens");
  return <PaginaMensagens sessao={sessao} com={idConversa} />;
}

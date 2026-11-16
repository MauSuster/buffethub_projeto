import type { Metadata } from "next";
import { exigirBuffet } from "@/lib/auth";
import { PaginaMensagens } from "@/components/mensagens/pagina-mensagens";

export const metadata: Metadata = { title: "Mensagens" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// T8.5 Mensagens (UC03)
export default async function MensagensAnfitriao({ searchParams }: Props) {
  const { com } = await searchParams;
  const idConversa = typeof com === "string" && com ? com : undefined;
  const sessao = await exigirBuffet(idConversa ? `/anfitriao/mensagens?com=${encodeURIComponent(idConversa)}` : "/anfitriao/mensagens");
  return <PaginaMensagens sessao={sessao} com={idConversa} />;
}

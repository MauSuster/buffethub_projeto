"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, X } from "lucide-react";
import { classesBotao } from "@/components/ui/botao";
import {
  definirComparacao,
  lembrarBusca,
  removerDaComparacao,
  useHrefUltimaBusca,
  type ItemComparacao,
} from "@/components/busca/comparacao-store";

/** Guarda a busca atual para o "Voltar à busca" da comparação voltar com os mesmos filtros. */
export function LembrarBusca({ consulta }: { consulta: string }) {
  useEffect(() => {
    lembrarBusca(consulta);
  }, [consulta]);
  return null;
}

/** UC06 A2: volta para a lista de resultados com os mesmos filtros. */
export function LinkVoltarBusca({
  className,
  comoBotao,
  children,
}: {
  className?: string;
  comoBotao?: "primario" | "secundario";
  children: React.ReactNode;
}) {
  const href = useHrefUltimaBusca();
  return (
    <Link href={href} className={comoBotao ? classesBotao(comoBotao, "md", className) : className}>
      {children}
    </Link>
  );
}

/** Mantém a seleção do navegador igual aos buffets mostrados na comparação. */
export function SincronizarComparacao({ itens }: { itens: ItemComparacao[] }) {
  useEffect(() => {
    definirComparacao(itens);
  }, [itens]);
  return null;
}

/** UC06 A1: tira um buffet da comparação e atualiza a tela com os que sobraram. */
export function BotaoRemover({ id, nome, ids }: { id: string; nome: string; ids: string[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      aria-label={`Remover ${nome} da comparação`}
      onClick={() => {
        removerDaComparacao(id);
        const resto = ids.filter((i) => i !== id);
        iniciar(() => router.replace(`/comparar?ids=${resto.join(",")}`, { scroll: false }));
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pendente ? <LoaderCircle className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      Remover
    </button>
  );
}

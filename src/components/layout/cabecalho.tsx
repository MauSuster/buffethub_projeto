import Link from "next/link";
import { Search } from "lucide-react";
import { obterSessao } from "@/lib/auth";
import { BotaoLink } from "@/components/ui/botao";
import { Logo } from "@/components/layout/logo";
import { MenuUsuario } from "@/components/layout/menu-usuario";
import { SinoNotificacoes } from "@/components/notificacoes/sino";

export async function Cabecalho() {
  const sessao = await obterSessao();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              <Search className="size-4" /> Buscar buffets
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {sessao ? (
            <>
              <SinoNotificacoes usuarioId={sessao.id} />
              <MenuUsuario nome={sessao.nomeExibicao} email={sessao.email} tipo={sessao.tipo} />
            </>
          ) : (
            <>
              <BotaoLink href="/login" variante="fantasma">
                Entrar
              </BotaoLink>
              <BotaoLink href="/cadastro">Criar conta</BotaoLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

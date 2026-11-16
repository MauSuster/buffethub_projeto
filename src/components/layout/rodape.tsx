import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Rodape() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p>Encontre, compare e contrate o buffet ideal para o seu evento.</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 font-medium text-slate-600">
            <Link href="/" className="hover:text-brand-700">Buscar buffets</Link>
            <Link href="/cadastro?tipo=buffet" className="hover:text-brand-700">Anuncie seu buffet</Link>
            <Link href="/privacidade" className="hover:text-brand-700">Privacidade e termos</Link>
          </nav>
        </div>
        <p className="sm:text-right">
          Projeto acadêmico · FECAP · Grupo CTRL+ALT+DEL
          <br />
          Pagamentos simulados: nenhum valor é cobrado de verdade.
        </p>
      </div>
    </footer>
  );
}

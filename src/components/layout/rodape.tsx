import { Logo } from "@/components/layout/logo";

export function Rodape() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p>Encontre, compare e contrate o buffet ideal para o seu evento.</p>
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

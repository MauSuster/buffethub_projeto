"use client";

import { useState, useSyncExternalStore } from "react";
import { List, Map as IconeMapa } from "lucide-react";
import { CartaoBuffet } from "@/components/busca/cartao-buffet";
import { MapaBuffets } from "@/components/busca/mapa";
import { cn } from "@/lib/cn";
import type { BuffetBusca } from "@/lib/database.types";

type Modo = "lista" | "mapa";

const TELA_LARGA = "(min-width: 1280px)";

function assinarTela(avisar: () => void) {
  const consulta = window.matchMedia(TELA_LARGA);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}
const telaLarga = () => window.matchMedia(TELA_LARGA).matches;
const telaLargaServidor = () => false;

let ultimoModo: Modo = "lista";

function BotaoModo({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
        ativo ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

/** Resultados da busca (UC04): contagem, alternância Lista/Mapa, cartões e mapa ao lado em telas largas. */
export function ResultadosBusca({ buffets }: { buffets: BuffetBusca[] }) {
  const [modo, setModo] = useState<Modo>(() => ultimoModo);
  const [destaque, setDestaque] = useState<string | null>(null);
  const largo = useSyncExternalStore(assinarTela, telaLarga, telaLargaServidor);
  const total = buffets.length;

  function trocarModo(novo: Modo) {
    ultimoModo = novo;
    setModo(novo);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl" aria-live="polite">
          {total} {total === 1 ? "buffet encontrado" : "buffets encontrados"}
        </h2>
        <div role="group" aria-label="Forma de exibição" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <BotaoModo ativo={modo === "lista"} onClick={() => trocarModo("lista")}>
            <List className="size-4" /> Lista
          </BotaoModo>
          <BotaoModo ativo={modo === "mapa"} onClick={() => trocarModo("mapa")}>
            <IconeMapa className="size-4" /> Mapa
          </BotaoModo>
        </div>
      </div>

      {modo === "mapa" ? (
        <MapaBuffets
          buffets={buffets}
          destaqueId={destaque}
          onDestacar={setDestaque}
          zoomComRoda
          className="h-[68vh] min-h-[420px]"
        />
      ) : (
        <div className={cn("grid gap-6", largo && "grid-cols-[minmax(0,1fr)_minmax(300px,380px)]")}>
          <ol className="space-y-4">
            {buffets.map((b, i) => (
              <li key={b.id}>
                <CartaoBuffet buffet={b} numero={i + 1} destacado={destaque === b.id} onDestacar={setDestaque} />
              </li>
            ))}
          </ol>
          {largo && (
            <div className="sticky top-24 h-[calc(100vh-8rem)] max-h-[760px] self-start">
              <MapaBuffets buffets={buffets} destaqueId={destaque} onDestacar={setDestaque} className="size-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

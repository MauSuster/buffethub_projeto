"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Botao } from "@/components/ui/botao";

export function BotaoCopiar({ texto, rotulo = "Copiar", className }: { texto: string; rotulo?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Botao type="button" variante="secundario" tamanho="sm" onClick={copiar} className={className} aria-live="polite">
      {copiado ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copiado ? "Copiado!" : rotulo}
    </Botao>
  );
}

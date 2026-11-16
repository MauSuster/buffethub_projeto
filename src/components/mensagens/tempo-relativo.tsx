"use client";

import { useEffect, useState } from "react";
import { dataHora, tempoRelativo } from "@/lib/formatos";

/** "há 5 min" que se atualiza sozinho a cada minuto. */
export function TempoRelativo({ iso, className }: { iso: string; className?: string }) {
  const [, setTique] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTique((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <time dateTime={iso} title={dataHora(iso)} className={className} suppressHydrationWarning>
      {tempoRelativo(iso)}
    </time>
  );
}

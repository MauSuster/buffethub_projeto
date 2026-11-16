"use client";

import { useState } from "react";
import type { EstadoAcao } from "@/lib/acoes";

/**
 * Erros por campo vindos da Server Action. O erro de um campo some assim que o usuário
 * mexe nele, sem esperar o próximo envio.
 */
export function useErrosCampos(estado: EstadoAcao) {
  const [limpos, setLimpos] = useState<{ estado: EstadoAcao; campos: string[] }>({ estado, campos: [] });
  const campos = limpos.estado === estado ? limpos.campos : [];

  function erro(nome: string) {
    return campos.includes(nome) ? undefined : estado.erros?.[nome];
  }

  function limpar(evento: React.FormEvent<HTMLFormElement>) {
    const nome = (evento.target as HTMLInputElement).name;
    if (nome && estado.erros?.[nome] && !campos.includes(nome)) setLimpos({ estado, campos: [...campos, nome] });
  }

  return { erro, limpar };
}

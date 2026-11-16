import { dataPorExtenso, hojeISO } from "@/lib/formatos";

const FUSO = "America/Sao_Paulo";

/** "2026-11-16T17:32:00Z" → "14:32" (horário de Brasília). */
export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
}

/** Dia do envio (AAAA-MM-DD) no fuso de São Paulo, para agrupar as mensagens. */
export function diaDe(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: FUSO });
}

/** "Hoje", "Ontem" ou "segunda-feira, 9 de novembro de 2026". */
export function rotuloDia(dia: string) {
  if (dia === hojeISO()) return "Hoje";
  const ontem = new Date(Date.now() - 86_400_000).toLocaleDateString("sv-SE", { timeZone: FUSO });
  if (dia === ontem) return "Ontem";
  return dataPorExtenso(dia);
}

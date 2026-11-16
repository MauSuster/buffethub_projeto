const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function partes(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { a, m, d: d || 1 };
}

/** "2026-11" é um mês válido? */
export function mesValido(valor: string | undefined): valor is string {
  return !!valor && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

export function deslocarMes(mes: string, delta: number) {
  const { a, m } = partes(mes);
  const total = a * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function diasNoMes(mes: string) {
  const { a, m } = partes(mes);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

/** Dia da semana do dia 1 (0 = domingo). */
export function primeiroDiaDaSemana(mes: string) {
  const { a, m } = partes(mes);
  return new Date(Date.UTC(a, m - 1, 1)).getUTCDay();
}

export function limitesDoMes(mes: string) {
  return { inicio: `${mes}-01`, fim: `${mes}-${String(diasNoMes(mes)).padStart(2, "0")}` };
}

/** "2026-11" → "Novembro de 2026" */
export function nomeDoMes(mes: string) {
  const { a, m } = partes(mes);
  const nome = MESES[m - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${a}`;
}

export function nomeCurtoDoMes(iso: string) {
  return MESES[partes(iso).m - 1].slice(0, 3);
}

export function somarDias(iso: string, dias: number) {
  const { a, m, d } = partes(iso);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** "2026-12-05" → "sábado" */
export function diaDaSemana(iso: string) {
  const { a, m, d } = partes(iso);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
}

/** Dias entre hoje e a data (negativo se já passou). */
export function diasAte(iso: string, hoje: string) {
  const alvo = partes(iso);
  const base = partes(hoje);
  return Math.round((Date.UTC(alvo.a, alvo.m - 1, alvo.d) - Date.UTC(base.a, base.m - 1, base.d)) / 86400000);
}

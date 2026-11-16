export const TIPOS_EVENTO = ["Casamento", "Aniversário", "15 anos", "Infantil", "Corporativo", "Formatura"];

export const ESTILOS_CULINARIA = ["Brasileira", "Contemporânea", "Italiana", "Japonesa", "Churrasco", "Árabe", "Vegetariana"];

export const EXTENSOES_FOTO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

/** Converte "1.234,56", "1234.56" ou "1.500" em número; devolve NaN se o texto não for um valor válido. */
export function lerValor(texto: string) {
  let s = texto.replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
}

/** 1234.5 → "1.234,50" (para preencher campos de valor). */
export function valorParaCampo(valor: number | null | undefined) {
  if (valor == null) return "";
  return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Separa o texto dos itens do cardápio (vírgula, ponto e vírgula ou quebra de linha) para mostrar em lista. */
export function separarItens(texto: string | null | undefined) {
  return (texto ?? "")
    .split(/\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Aceita só caminhos internos do site ("/cliente/contratos?x=1").
 * Bloqueia "//outro-site.com", barras invertidas e caracteres de controle, que o navegador
 * transformaria em endereço externo (redirecionamento aberto).
 */
export function destinoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  if (valor.includes("\\") || /[\u0000-\u001f\u007f]/.test(valor)) return null;
  return valor;
}

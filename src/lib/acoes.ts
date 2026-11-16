// Padrão de retorno das Server Actions (controllers) usado com useActionState nos formulários.

export type EstadoAcao = {
  ok?: boolean;
  mensagem?: string;
  /** Erros por campo do formulário: { email: "E-mail inválido." } */
  erros?: Record<string, string>;
  /** Valores enviados, para o formulário não perder o que o usuário digitou quando dá erro. */
  valores?: Record<string, string>;
};

export const estadoInicial: EstadoAcao = {};

const TRADUCOES: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha inválidos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."],
  [/user already registered|already been registered/i, "Este e-mail já está cadastrado."],
  [/database error saving new user/i, "Não foi possível criar a conta. Verifique se o CPF/CNPJ já não está cadastrado."],
  [/password should be at least (\d+)/i, "A senha precisa ter pelo menos 6 caracteres."],
  [/weak password|password is too weak/i, "Senha fraca. Use letras, números e pelo menos 8 caracteres."],
  [/rate limit|too many requests/i, "Muitas tentativas seguidas. Aguarde um pouco e tente de novo."],
  [/unable to validate email address|invalid email/i, "E-mail inválido."],
  [/same password|new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/jwt expired|refresh token/i, "Sua sessão expirou. Entre novamente."],
  [/duplicate key.*cpf/i, "Este CPF já está cadastrado."],
  [/duplicate key.*cnpj/i, "Este CNPJ já está cadastrado."],
  [/permission denied|row-level security/i, "Você não tem permissão para fazer isso."],
  [/failed to fetch|network/i, "Não foi possível conectar ao servidor. Verifique sua internet."],
];

/** Converte erros do Supabase em mensagens em português. As funções do banco já devolvem mensagens em português. */
export function traduzirErro(erro: { message?: string } | null | undefined, padrao = "Algo deu errado. Tente novamente.") {
  const msg = erro?.message ?? "";
  if (!msg) return padrao;
  for (const [regra, texto] of TRADUCOES) if (regra.test(msg)) return texto;
  if (/[áéíóúãõç]/i.test(msg) || /^[A-ZÁÉÍÓÚ][^.]*\.$/.test(msg)) return msg;
  return padrao;
}

/** Lê um campo de texto do FormData (string vazia se não veio). */
export function campo(form: FormData, nome: string) {
  const v = form.get(nome);
  return typeof v === "string" ? v.trim() : "";
}

/** Copia os campos de texto do FormData para reexibir no formulário. Nunca inclui senhas. */
export function valoresDoForm(form: FormData) {
  const valores: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string" && !/senha|password|cartao|cvv/i.test(k)) valores[k] = v;
  });
  return valores;
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { areaInicial, obterSessao } from "@/lib/auth";
import { campo, traduzirErro, valoresDoForm, type EstadoAcao } from "@/lib/acoes";
import { cnpjValido, cpfValido, mascaraTelefone, somenteDigitos } from "@/lib/formatos";
import { criarClientePublico, criarClienteServidor } from "@/lib/supabase/server";
import { destinoSeguro } from "@/components/conta/destino";
import type { TipoUsuario } from "@/lib/database.types";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SENHA_MINIMA = 8;
const MAX_PREFERENCIAS = 500;

async function origemDoSite() {
  const h = await headers();
  const origem = h.get("origin");
  if (origem) return origem;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

function senhaDoForm(form: FormData, nome: string) {
  const valor = form.get(nome);
  return typeof valor === "string" ? valor : "";
}

function validarEmail(email: string) {
  if (!email) return "Informe o e-mail.";
  if (!FORMATO_EMAIL.test(email)) return "E-mail inválido. Ex.: nome@exemplo.com";
  return undefined;
}

function validarNovaSenha(senha: string) {
  if (!senha) return "Crie uma senha.";
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  return undefined;
}

function semErros(erros: Record<string, string | undefined>) {
  return Object.values(erros).every((e) => !e);
}

function limparErros(erros: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(erros).filter(([, e]) => e)) as Record<string, string>;
}

/** Regras de senha configuradas no Supabase Auth (tamanho, complexidade, senha repetida). */
function erroDeSenha(erro: { message: string; code?: string }) {
  const tamanho = erro.message.match(/at least (\d+) characters/i);
  if (tamanho) return `A senha precisa ter pelo menos ${tamanho[1]} caracteres.`;
  if (erro.code === "weak_password" || /password should contain|weak password|password is too weak|pwned/i.test(erro.message)) {
    return "Senha fraca. Misture letras maiúsculas, minúsculas, números e símbolos.";
  }
  if (erro.code === "same_password" || /same password|should be different/i.test(erro.message)) {
    return "A nova senha precisa ser diferente da atual.";
  }
  return null;
}

/** UC01 Criar Conta (T1.0). O perfil (usuario + cliente/buffet) é criado pelo gatilho do banco a partir de options.data. */
export async function criarConta(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const valores = valoresDoForm(form);
  const tipo: TipoUsuario = campo(form, "tipo") === "buffet" ? "buffet" : "cliente";
  const nome = campo(form, "nome").replace(/\s+/g, " ");
  const email = campo(form, "email").toLowerCase();
  const senha = senhaDoForm(form, "senha");
  const telefone = somenteDigitos(campo(form, "telefone"));
  const cpf = somenteDigitos(campo(form, "cpf"));
  const cnpj = somenteDigitos(campo(form, "cnpj"));
  const nomeFantasia = campo(form, "nome_fantasia").replace(/\s+/g, " ");

  const erros: Record<string, string | undefined> = {
    nome: nome.length < 3 ? (tipo === "buffet" ? "Informe o nome do responsável." : "Informe seu nome completo.") : undefined,
    email: validarEmail(email),
    senha: validarNovaSenha(senha),
    telefone: telefone.length < 10 ? "Informe o telefone com DDD." : undefined,
    aceite: form.get("aceite") ? undefined : "Para criar a conta, aceite a Política de Privacidade e os Termos de Uso.",
  };
  if (tipo === "cliente") {
    erros.cpf = !cpf ? "Informe o CPF." : !cpfValido(cpf) ? "CPF inválido. Confira os números." : undefined;
  } else {
    erros.cnpj = !cnpj ? "Informe o CNPJ." : !cnpjValido(cnpj) ? "CNPJ inválido. Confira os números." : undefined;
    erros.nome_fantasia = nomeFantasia.length < 2 ? "Informe o nome fantasia do buffet." : undefined;
  }
  if (!semErros(erros)) {
    return { mensagem: "Confira os campos destacados.", erros: limparErros(erros), valores };
  }

  // A tabela buffet é pública, então dá para avisar do CNPJ repetido antes de criar a conta (UC01 E2).
  if (tipo === "buffet") {
    const { data: existente } = await criarClientePublico().from("buffet").select("usuario_id").eq("cnpj", cnpj).maybeSingle();
    if (existente) {
      return { mensagem: "Este CNPJ já está cadastrado.", erros: { cnpj: "Este CNPJ já está cadastrado. Tente entrar na conta." }, valores };
    }
  }

  const destino = destinoSeguro(campo(form, "next")) ?? areaInicial(tipo);
  const dadosPerfil =
    tipo === "cliente"
      ? { tipo, nome, telefone: mascaraTelefone(telefone), cpf }
      : { tipo, nome, telefone: mascaraTelefone(telefone), cnpj, nome_fantasia: nomeFantasia };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: dadosPerfil,
      emailRedirectTo: `${await origemDoSite()}/auth/callback?next=${encodeURIComponent(destino)}`,
    },
  });

  if (error) {
    const senhaRecusada = erroDeSenha(error);
    if (senhaRecusada) return { mensagem: senhaRecusada, erros: { senha: senhaRecusada }, valores };
    const errosCampo: Record<string, string> = {};
    if (/already registered|already been registered/i.test(error.message)) errosCampo.email = "Este e-mail já está cadastrado.";
    // O gatilho do banco só falha por CPF/CNPJ repetido (os formatos já foram validados acima).
    if (/database error saving new user/i.test(error.message)) {
      if (tipo === "cliente") errosCampo.cpf = "Este CPF já está cadastrado.";
      else errosCampo.cnpj = "Este CNPJ já está cadastrado.";
    }
    return { mensagem: traduzirErro(error, "Não foi possível criar a conta. Tente novamente."), erros: errosCampo, valores };
  }

  // Com a confirmação de e-mail ligada, o Supabase devolve um usuário "falso" sem identidades quando o e-mail já existe.
  if (data.user && data.user.identities?.length === 0) {
    return {
      mensagem: "Este e-mail já está cadastrado.",
      erros: { email: "Este e-mail já está cadastrado. Entre ou recupere a senha." },
      valores,
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(destino);
  }

  return { ok: true, mensagem: `Enviamos um link de confirmação para ${email}.`, valores: { email } };
}

/** UC02 Efetuar Login (T2.0). */
export async function entrar(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const valores = valoresDoForm(form);
  const email = campo(form, "email").toLowerCase();
  const senha = senhaDoForm(form, "senha");

  const erros = { email: validarEmail(email), senha: senha ? undefined : "Informe a senha." };
  if (!semErros(erros)) return { mensagem: "Preencha e-mail e senha.", erros: limparErros(erros), valores };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.user) {
    return { mensagem: traduzirErro(error, "E-mail ou senha inválidos."), valores };
  }

  const { data: usuario } = await supabase.from("usuario").select("tipo").eq("id", data.user.id).maybeSingle();
  revalidatePath("/", "layout");
  redirect(destinoSeguro(campo(form, "next")) ?? (usuario ? areaInicial(usuario.tipo) : "/"));
}

/** UC02 A1 Esqueci minha senha (T3.0, passo 1). A resposta é sempre a mesma para não revelar se o e-mail tem conta. */
export async function recuperarSenha(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const email = campo(form, "email").toLowerCase();
  const erroEmail = validarEmail(email);
  if (erroEmail) return { mensagem: erroEmail, erros: { email: erroEmail }, valores: { email } };

  const supabase = await criarClienteServidor();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origemDoSite()}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
  });

  return {
    ok: true,
    mensagem: `Se existir uma conta com ${email}, você vai receber em instantes um link para criar uma nova senha. Confira também a caixa de spam.`,
    valores: { email },
  };
}

/** UC02 A1 Definir nova senha (T3.0, passo 2): a sessão vem do link enviado por e-mail. */
export async function redefinirSenha(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const senha = senhaDoForm(form, "senha");
  const confirmacao = senhaDoForm(form, "confirmar_senha");

  const erros = {
    senha: validarNovaSenha(senha),
    confirmar_senha: !confirmacao ? "Repita a nova senha." : confirmacao !== senha ? "As senhas não conferem." : undefined,
  };
  if (!semErros(erros)) return { mensagem: "Confira os campos destacados.", erros: limparErros(erros) };

  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { mensagem: "O link de recuperação expirou. Peça um novo link para trocar a senha." };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    const senhaRecusada = erroDeSenha(error);
    if (senhaRecusada) return { mensagem: senhaRecusada, erros: { senha: senhaRecusada } };
    return { mensagem: traduzirErro(error, "Não foi possível alterar a senha. Tente novamente.") };
  }

  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Senha alterada com sucesso! Levando você para a sua área…" };
}

/** UC16 Editar Perfil (T7.5): nome, telefone e preferências. E-mail e CPF não podem ser alterados. */
export async function salvarPerfil(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const valores = valoresDoForm(form);
  const sessao = await obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    return { mensagem: "Sua sessão expirou. Entre novamente para editar o perfil.", valores };
  }

  const nome = campo(form, "nome").replace(/\s+/g, " ");
  const telefone = somenteDigitos(campo(form, "telefone"));
  const preferencias = campo(form, "preferencias");

  const erros = {
    nome: nome.length < 3 ? "Informe seu nome completo." : nome.length > 120 ? "Use no máximo 120 caracteres." : undefined,
    telefone: !telefone ? "Informe o telefone." : telefone.length < 10 ? "Informe o telefone com DDD." : undefined,
    preferencias: preferencias.length > MAX_PREFERENCIAS ? `Use no máximo ${MAX_PREFERENCIAS} caracteres.` : undefined,
  };
  if (!semErros(erros)) return { mensagem: "Confira os campos destacados.", erros: limparErros(erros), valores };

  const supabase = await criarClienteServidor();
  const { data: atualizado, error: erroUsuario } = await supabase
    .from("usuario")
    .update({ nome, telefone: mascaraTelefone(telefone) })
    .eq("id", sessao.id)
    .select("id");
  if (erroUsuario || !atualizado?.length) {
    return { mensagem: traduzirErro(erroUsuario, "Não foi possível salvar seus dados. Tente novamente."), valores };
  }

  const { error: erroCliente } = await supabase
    .from("cliente")
    .update({ preferencias: preferencias || null })
    .eq("usuario_id", sessao.id);
  if (erroCliente) {
    return { mensagem: traduzirErro(erroCliente, "Seus dados foram salvos, mas as preferências não. Tente novamente."), valores };
  }

  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Perfil atualizado com sucesso.", valores: { ...valores, nome, telefone: mascaraTelefone(telefone) } };
}

/** UC16: troca de senha opcional dentro do perfil, confirmando a senha atual. */
export async function alterarSenha(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const sessao = await obterSessao();
  if (!sessao) return { mensagem: "Sua sessão expirou. Entre novamente." };

  const atual = senhaDoForm(form, "senha_atual");
  const nova = senhaDoForm(form, "nova_senha");
  const confirmacao = senhaDoForm(form, "confirmar_senha");

  const erros = {
    senha_atual: atual ? undefined : "Informe a senha atual.",
    nova_senha: validarNovaSenha(nova) ?? (nova === atual ? "A nova senha precisa ser diferente da atual." : undefined),
    confirmar_senha: !confirmacao ? "Repita a nova senha." : confirmacao !== nova ? "As senhas não conferem." : undefined,
  };
  if (!semErros(erros)) return { mensagem: "Confira os campos destacados.", erros: limparErros(erros) };

  const supabase = await criarClienteServidor();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({ email: sessao.email, password: atual });
  if (erroLogin) {
    if (/invalid login credentials/i.test(erroLogin.message)) {
      return { mensagem: "A senha atual está incorreta.", erros: { senha_atual: "Senha atual incorreta." } };
    }
    return { mensagem: traduzirErro(erroLogin) };
  }

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) {
    const senhaRecusada = erroDeSenha(error);
    if (senhaRecusada) return { mensagem: senhaRecusada, erros: { nova_senha: senhaRecusada } };
    return { mensagem: traduzirErro(error, "Não foi possível alterar a senha. Tente novamente.") };
  }

  return { ok: true, mensagem: "Senha alterada com sucesso. Use a nova senha no próximo login." };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirBuffet } from "@/lib/auth";
import { campo, valoresDoForm, type EstadoAcao } from "@/lib/acoes";
import { hojeISO, mascaraTelefone, somenteDigitos } from "@/lib/formatos";
import { EXTENSOES_FOTO, TIPOS_EVENTO, lerValor } from "@/components/anfitriao/constantes";
import * as modelo from "@/models/anfitriao";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const CORRIJA = "Confira os campos destacados.";

function revalidarPerfil(buffetId: string) {
  revalidatePath("/anfitriao", "layout");
  revalidatePath(`/buffet/${buffetId}`);
  revalidatePath("/");
}

function lerCoordenada(texto: string, limite: number) {
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) && Math.abs(n) <= limite ? n : NaN;
}

/** UC17: salva os dados do buffet (T8.1). */
export async function salvarDadosBuffet(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/dados");
  const tipos = form.getAll("tipos_evento").filter((t): t is string => typeof t === "string" && TIPOS_EVENTO.includes(t));
  const valores = { ...valoresDoForm(form), tipos_evento: tipos.join("|") };

  const nome = campo(form, "nome_fantasia");
  const descricao = campo(form, "descricao");
  const endereco = campo(form, "endereco");
  const cidade = campo(form, "cidade");
  const capacidadeTexto = campo(form, "capacidade_maxima");
  const capacidade = Number(capacidadeTexto);
  const telefone = somenteDigitos(campo(form, "telefone"));
  const latitude = lerCoordenada(campo(form, "latitude"), 90);
  const longitude = lerCoordenada(campo(form, "longitude"), 180);

  const erros: Record<string, string> = {};
  if (nome.length < 2) erros.nome_fantasia = "Informe o nome fantasia do buffet.";
  else if (nome.length > 100) erros.nome_fantasia = "Use no máximo 100 caracteres.";
  if (!descricao) erros.descricao = "Descreva o seu buffet para os clientes.";
  else if (descricao.length > 2000) erros.descricao = "Use no máximo 2.000 caracteres.";
  if (!endereco) erros.endereco = "Informe o endereço.";
  if (!cidade) erros.cidade = "Informe a cidade.";
  if (!capacidadeTexto) erros.capacidade_maxima = "Informe a capacidade máxima de convidados.";
  else if (!Number.isInteger(capacidade) || capacidade <= 0) erros.capacidade_maxima = "A capacidade precisa ser maior que zero.";
  else if (capacidade > 100000) erros.capacidade_maxima = "Capacidade muito alta. Confira o número.";
  if (tipos.length === 0) erros.tipos_evento = "Marque pelo menos um tipo de evento.";
  if (telefone && telefone.length !== 10 && telefone.length !== 11) erros.telefone = "Telefone inválido. Use DDD + número.";
  if (Number.isNaN(latitude) || Number.isNaN(longitude) || (latitude === null) !== (longitude === null)) {
    erros.localizacao = "Localização inválida. Clique no mapa para marcar de novo.";
  }
  if (Object.keys(erros).length) return { mensagem: CORRIJA, erros, valores };

  const erro = await modelo.salvarDadosBuffet(
    sessao.id,
    {
      nome_fantasia: nome,
      descricao,
      endereco,
      cidade,
      latitude,
      longitude,
      capacidade_maxima: capacidade,
      estilo_culinaria: campo(form, "estilo_culinaria") || null,
      tipos_evento: tipos,
      servicos: campo(form, "servicos") || null,
    },
    telefone ? mascaraTelefone(telefone) : null,
  );
  if (erro) return { mensagem: erro, valores };

  // O nome fantasia aparece no cabeçalho de todas as telas
  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Dados do buffet salvos. Seu perfil público já foi atualizado.", valores };
}

/** UC17: depois do upload no Storage, grava a foto no portfólio. O caminho precisa estar na pasta do próprio buffet. */
export async function registrarFotoPortfolio(caminho: string): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/dados");
  const extensoes = Object.values(EXTENSOES_FOTO).join("|");
  const valido = new RegExp(`^${sessao.id}/[0-9a-f-]{36}\\.(${extensoes})$`, "i");
  if (!valido.test(caminho)) return { mensagem: "Arquivo inválido." };
  const erro = await modelo.registrarFoto(sessao.id, caminho);
  if (erro) return { mensagem: erro };
  revalidarPerfil(sessao.id);
  return { ok: true, mensagem: "Foto adicionada ao portfólio." };
}

export async function removerFotoPortfolio(fotoId: string): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/dados");
  if (!UUID.test(fotoId)) return { mensagem: "Foto não encontrada." };
  const erro = await modelo.removerFoto(sessao.id, fotoId);
  if (erro) return { mensagem: erro };
  revalidarPerfil(sessao.id);
  return { ok: true, mensagem: "Foto removida do portfólio." };
}

/** UC18: cria um pacote ou, se vier o id, edita (A1). */
export async function salvarPacote(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/cardapio");
  const valores = valoresDoForm(form);
  const id = campo(form, "id");
  const nome = campo(form, "nome");
  const itens = campo(form, "itens_cardapio");
  const precoTexto = campo(form, "preco_por_pessoa");
  const preco = lerValor(precoTexto);

  const erros: Record<string, string> = {};
  if (nome.length < 2) erros.nome = "Informe o nome do pacote.";
  else if (nome.length > 80) erros.nome = "Use no máximo 80 caracteres.";
  if (!itens.replace(/[\s,;]/g, "")) erros.itens_cardapio = "Informe pelo menos um item do cardápio.";
  if (!precoTexto) erros.preco_por_pessoa = "Informe o preço por pessoa.";
  else if (Number.isNaN(preco) || preco <= 0) erros.preco_por_pessoa = "O preço precisa ser um valor maior que zero.";
  else if (preco > 99999.99) erros.preco_por_pessoa = "Preço muito alto. Confira o valor.";
  if (id && !UUID.test(id)) return { mensagem: "Pacote não encontrado.", valores };
  if (Object.keys(erros).length) return { mensagem: CORRIJA, erros, valores };

  const dados = {
    nome,
    itens_cardapio: itens,
    preco_por_pessoa: preco,
    servicos_adicionais: campo(form, "servicos_adicionais") || null,
    ativo: form.get("ativo") === "on",
  };
  const erro = id ? await modelo.atualizarPacote(sessao.id, id, dados) : await modelo.criarPacote(sessao.id, dados);
  if (erro) return { mensagem: erro, valores };

  revalidarPerfil(sessao.id);
  return { ok: true, mensagem: id ? `Pacote “${nome}” atualizado.` : `Pacote “${nome}” criado.` };
}

/** Pacote inativo some do perfil público, mas continua guardado para ser reativado. */
export async function alterarSituacaoPacote(pacoteId: string, ativo: boolean): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/cardapio");
  if (!UUID.test(pacoteId)) return { mensagem: "Pacote não encontrado." };
  const erro = await modelo.atualizarPacote(sessao.id, pacoteId, { ativo });
  if (erro) return { mensagem: erro };
  revalidarPerfil(sessao.id);
  return {
    ok: true,
    mensagem: ativo ? "Pacote ativado: ele já aparece no seu perfil." : "Pacote desativado: ele não aparece mais no seu perfil.",
  };
}

/** UC18 A2: exclusão confirmada na tela. */
export async function excluirPacote(pacoteId: string): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/cardapio");
  if (!UUID.test(pacoteId)) return { mensagem: "Pacote não encontrado." };
  const erro = await modelo.excluirPacote(sessao.id, pacoteId);
  if (erro) return { mensagem: erro };
  revalidarPerfil(sessao.id);
  return { ok: true, mensagem: "Pacote excluído." };
}

/** UC19: bloqueia ou libera uma data futura (A1). Datas reservadas e passadas são recusadas pelo banco (E1). */
export async function alterarDisponibilidade(data: string, status: "Livre" | "Bloqueada"): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/calendario");
  if (!DATA_ISO.test(data) || (status !== "Livre" && status !== "Bloqueada")) return { mensagem: "Data inválida." };
  if (data < hojeISO()) return { mensagem: "Não é possível alterar datas passadas." };
  const erro = await modelo.definirDisponibilidade(data, status);
  if (erro) return { mensagem: erro };
  revalidatePath("/anfitriao/calendario");
  revalidatePath(`/buffet/${sessao.id}`);
  return { ok: true, mensagem: status === "Bloqueada" ? "Data bloqueada." : "Data liberada." };
}

/** UC20: envia a proposta de uma solicitação pendente. */
export async function enviarProposta(_estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const sessao = await exigirBuffet("/anfitriao/solicitacoes");
  const valores = valoresDoForm(form);
  const solicitacaoId = campo(form, "solicitacao_id");
  if (!UUID.test(solicitacaoId)) return { mensagem: "Solicitação não encontrada.", valores };

  const negociacao = await modelo.obterNegociacao(sessao.id, solicitacaoId);
  if (!negociacao) return { mensagem: "Solicitação não encontrada.", valores };
  if (negociacao.status_solicitacao !== "Pendente") {
    return { mensagem: "Esta solicitação já foi respondida ou cancelada.", valores };
  }

  const valorTexto = campo(form, "valor_total");
  const valor = lerValor(valorTexto);
  const descricao = campo(form, "descricao");
  const validade = campo(form, "validade");
  const hoje = hojeISO();

  const erros: Record<string, string> = {};
  if (!valorTexto) erros.valor_total = "Informe o valor total.";
  else if (Number.isNaN(valor) || valor <= 0) erros.valor_total = "O valor precisa ser maior que zero.";
  else if (valor > 99999999.99) erros.valor_total = "Valor muito alto. Confira o número.";
  if (!descricao) erros.descricao = "Descreva o que está incluído na proposta.";
  else if (descricao.length > 2000) erros.descricao = "Use no máximo 2.000 caracteres.";
  if (!DATA_ISO.test(validade)) erros.validade = "Informe a validade da proposta.";
  else if (validade < hoje || validade > negociacao.data_evento) {
    erros.validade = "A validade precisa ficar entre hoje e a data do evento.";
  }
  if (Object.keys(erros).length) return { mensagem: CORRIJA, erros, valores };

  // UC20 E2: a função do banco não confere o calendário, então a checagem fica aqui
  const situacaoData = await modelo.statusDaData(sessao.id, negociacao.data_evento);
  if (situacaoData !== "Livre") {
    return {
      mensagem:
        situacaoData === "Reservada"
          ? "A data do evento já está reservada no seu calendário."
          : "A data do evento está bloqueada no seu calendário. Libere a data para enviar a proposta.",
      valores,
    };
  }

  const erro = await modelo.responderSolicitacao(solicitacaoId, valor, descricao, validade);
  if (erro) return { mensagem: erro, valores };

  revalidatePath("/anfitriao", "layout");
  redirect(`/anfitriao/solicitacoes?aba=respondidas&id=${solicitacaoId}&enviada=1`);
}

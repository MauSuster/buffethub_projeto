"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirCliente } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";
import { campo, traduzirErro, valoresDoForm, type EstadoAcao } from "@/lib/acoes";
import { hojeISO } from "@/lib/formatos";

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FALHA_ENVIO = "Não foi possível enviar a solicitação. Tente novamente.";

type DadosEvento = { tipo: string; data: string; local: string; convidados: number; servicos: string };

function amanhaISO() {
  const d = new Date(`${hojeISO()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function lerEvento(form: FormData): DadosEvento {
  const tipo = campo(form, "tipo_evento") === "Outro" ? campo(form, "tipo_outro") : campo(form, "tipo_evento");
  return {
    tipo,
    data: campo(form, "data"),
    local: campo(form, "local"),
    convidados: Number(campo(form, "num_convidados")),
    servicos: campo(form, "servicos_desejados"),
  };
}

/** UC09 E1 e E2: campos obrigatórios, data futura e convidados entre 1 e a capacidade do buffet. */
function validarEvento(form: FormData, evento: DadosEvento, capacidade: number | null): EstadoAcao | null {
  const erros: Record<string, string> = {};
  if (!campo(form, "tipo_evento")) erros.tipo_evento = "Escolha o tipo de evento.";
  else if (!evento.tipo) erros.tipo_outro = "Informe o tipo de evento.";
  if (!evento.data) erros.data = "Informe a data do evento.";
  if (!evento.local) erros.local = "Informe o local do evento.";
  if (!campo(form, "num_convidados")) erros.num_convidados = "Informe o número de convidados.";
  if (Object.keys(erros).length) return { mensagem: "Preencha todos os campos obrigatórios.", erros };

  if (!FORMATO_DATA.test(evento.data) || evento.data < amanhaISO()) {
    erros.data = "Escolha uma data a partir de amanhã.";
  }
  if (!Number.isInteger(evento.convidados) || evento.convidados < 1 || (capacidade != null && evento.convidados > capacidade)) {
    erros.num_convidados = capacidade != null ? `Informe de 1 a ${capacidade} convidados.` : "Informe um número de convidados maior que zero.";
  }
  if (Object.keys(erros).length) {
    return { mensagem: "Informe uma data futura e um número de convidados entre 1 e a capacidade do buffet.", erros };
  }
  if (evento.tipo.length > 60) return { mensagem: "O tipo de evento pode ter no máximo 60 caracteres.", erros: { tipo_outro: "Use no máximo 60 caracteres." } };
  if (evento.local.length > 200) return { mensagem: "O local pode ter no máximo 200 caracteres.", erros: { local: "Use no máximo 200 caracteres." } };
  return null;
}

function campoDoErro(mensagem: string, modo: "novo" | "existente"): Record<string, string> | undefined {
  if (/pacote/i.test(mensagem)) return { pacote_id: mensagem };
  if (modo === "existente") return { evento_id: mensagem };
  if (/data/i.test(mensagem)) return { data: mensagem };
  if (/convidados/i.test(mensagem)) return { num_convidados: mensagem };
  return undefined;
}

/** UC08 Solicitar Orçamento («include» UC09 Cadastrar Evento). */
export async function solicitarOrcamento(buffetId: string, _anterior: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  await exigirCliente(`/buffet/${buffetId}/orcamento`);
  const valores = valoresDoForm(form);
  if (!FORMATO_UUID.test(buffetId)) return { mensagem: "Buffet não encontrado.", valores };

  const modo = campo(form, "modo") === "existente" ? "existente" : "novo";
  const pacoteId = campo(form, "pacote_id") || null;
  const observacoes = campo(form, "observacoes");
  if (observacoes.length > 1000) {
    return { mensagem: "As observações podem ter no máximo 1000 caracteres.", erros: { observacoes: "Use no máximo 1000 caracteres." }, valores };
  }

  const supabase = await criarClienteServidor();
  const { data: buffet, error: erroBuffet } = await supabase
    .from("buffet")
    .select("capacidade_maxima")
    .eq("usuario_id", buffetId)
    .maybeSingle();
  if (erroBuffet) return { mensagem: FALHA_ENVIO, valores };
  if (!buffet) return { mensagem: "Buffet não encontrado.", valores };

  let eventoId = campo(form, "evento_id");

  if (modo === "existente") {
    if (!FORMATO_UUID.test(eventoId)) {
      return { mensagem: "Escolha um dos seus eventos ou cadastre um novo.", erros: { evento_id: "Escolha um evento." }, valores };
    }
  } else {
    const evento = lerEvento(form);
    const invalido = validarEvento(form, evento, buffet.capacidade_maxima);
    if (invalido) return { ...invalido, valores };

    // Confere agenda e pacote antes de gravar o evento, para não deixar evento solto se o pedido for recusado.
    const [{ data: ocupada }, { data: pacote }] = await Promise.all([
      supabase.from("disponibilidade").select("status").eq("buffet_id", buffetId).eq("data", evento.data).neq("status", "Livre").maybeSingle(),
      pacoteId
        ? supabase.from("pacote").select("id").eq("id", pacoteId).eq("buffet_id", buffetId).eq("ativo", true).maybeSingle()
        : Promise.resolve({ data: { id: "" } }),
    ]);
    if (ocupada) {
      return { mensagem: "O buffet não está disponível nesta data.", erros: { data: "Data indisponível neste buffet. Escolha outra." }, valores };
    }
    if (!pacote) return { mensagem: "Pacote inválido para este buffet.", erros: { pacote_id: "Escolha outro pacote." }, valores };

    const { data: novoId, error } = await supabase.rpc("cadastrar_evento", {
      p_tipo_evento: evento.tipo,
      p_data: evento.data,
      p_local: evento.local,
      p_num_convidados: evento.convidados,
      p_servicos_desejados: evento.servicos || null,
    });
    if (error || !novoId) {
      const mensagem = traduzirErro(error, "Não foi possível salvar o evento. Tente novamente.");
      return { mensagem, erros: campoDoErro(mensagem, modo), valores };
    }
    eventoId = novoId;
  }

  const { error } = await supabase.rpc("solicitar_orcamento", {
    p_buffet_id: buffetId,
    p_evento_id: eventoId,
    p_pacote_id: pacoteId,
    p_observacoes: observacoes || null,
  });

  if (error) {
    const mensagem = traduzirErro(error, FALHA_ENVIO);
    if (modo === "novo") {
      // O evento já foi gravado: a tela passa a usá-lo, para o cliente tentar de novo sem duplicar o evento.
      revalidatePath(`/buffet/${buffetId}/orcamento`);
      return {
        mensagem: `${mensagem} Seu evento foi salvo e já está selecionado em "Usar evento já cadastrado".`,
        erros: { evento_id: mensagem },
        valores: { ...valores, modo: "existente", evento_id: eventoId },
      };
    }
    return { mensagem, erros: campoDoErro(mensagem, modo), valores };
  }

  revalidatePath("/cliente");
  revalidatePath("/cliente/solicitacoes");
  redirect("/cliente/solicitacoes?nova=1");
}

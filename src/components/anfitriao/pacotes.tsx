"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Eye, EyeOff, Loader2, Pencil, Plus, Sparkles, Trash2, UtensilsCrossed, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { estadoInicial, type EstadoAcao } from "@/lib/acoes";
import { moeda } from "@/lib/formatos";
import type { Pacote } from "@/lib/database.types";
import { alterarSituacaoPacote, excluirPacote, salvarPacote } from "@/controllers/anfitriao";
import { Botao, BotaoEnviar } from "@/components/ui/botao";
import { AreaTexto, Entrada } from "@/components/ui/campos";
import { Alerta, Cartao, MensagemAcao, Selo, Vazio } from "@/components/ui/basicos";
import { separarItens, valorParaCampo } from "./constantes";

type Edicao = { pacote: Pacote | null } | null;

/** T8.2 / UC18: lista de pacotes com criar, editar, ativar/desativar e excluir. */
export function GerenciarPacotes({ pacotes }: { pacotes: Pacote[] }) {
  const [edicao, setEdicao] = useState<Edicao>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<EstadoAcao>({});
  const [, iniciarTransicao] = useTransition();
  const ativos = pacotes.filter((p) => p.ativo).length;

  function executar(id: string, acao: () => Promise<EstadoAcao>) {
    setProcessando(id);
    iniciarTransicao(async () => {
      const r = await acao();
      setAviso(r);
      setProcessando(null);
      if (r.ok) setExcluindo(null);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {pacotes.length === 0
            ? "Nenhum pacote cadastrado."
            : `${pacotes.length} ${pacotes.length === 1 ? "pacote" : "pacotes"} · ${ativos} ${ativos === 1 ? "ativo" : "ativos"} no seu perfil`}
        </p>
        <Botao
          type="button"
          onClick={() => {
            setAviso({});
            setEdicao({ pacote: null });
          }}
        >
          <Plus className="size-4" /> Novo pacote
        </Botao>
      </div>

      <div aria-live="polite">
        <MensagemAcao estado={aviso} />
      </div>

      {pacotes.length === 0 ? (
        <Vazio
          Icone={UtensilsCrossed}
          titulo="Cadastre o seu primeiro pacote"
          texto="Os pacotes aparecem no seu perfil com o preço por pessoa e ajudam o cliente a pedir orçamento."
          acao={
            <Botao type="button" onClick={() => setEdicao({ pacote: null })}>
              <Plus className="size-4" /> Novo pacote
            </Botao>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {pacotes.map((p) => {
            const itens = separarItens(p.itens_cardapio);
            const ocupado = processando === p.id;
            return (
              <li key={p.id}>
                <Cartao className={cn("flex h-full flex-col overflow-hidden transition", !p.ativo && "bg-slate-50/80")}>
                  <div className={cn("h-1.5", p.ativo ? "bg-gradient-to-r from-brand-500 to-accent-400" : "bg-slate-200")} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={cn("text-lg font-semibold", p.ativo ? "text-slate-900" : "text-slate-500")}>{p.nome}</h3>
                      <Selo cor={p.ativo ? "verde" : "cinza"}>{p.ativo ? "Ativo" : "Inativo"}</Selo>
                    </div>
                    <p className="mt-2">
                      <span className={cn("text-2xl font-bold", p.ativo ? "text-brand-700" : "text-slate-500")}>
                        {moeda(p.preco_por_pessoa)}
                      </span>
                      <span className="text-sm text-slate-500"> /pessoa</span>
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {itens.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {p.servicos_adicionais && (
                      <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-50 px-3 py-2 text-sm text-accent-700">
                        <Sparkles className="mt-0.5 size-4 shrink-0" />
                        <span>
                          <span className="font-semibold">Adicionais:</span> {p.servicos_adicionais}
                        </span>
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      {excluindo === p.id ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-sm font-semibold text-red-700">Excluir o pacote “{p.nome}”?</p>
                          <p className="mt-0.5 text-xs text-red-600">
                            Essa ação não pode ser desfeita. Se quiser só tirar do perfil, use “Desativar”.
                          </p>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <Botao type="button" variante="secundario" tamanho="sm" onClick={() => setExcluindo(null)} disabled={ocupado}>
                              Cancelar
                            </Botao>
                            <Botao
                              type="button"
                              variante="perigo"
                              tamanho="sm"
                              onClick={() => executar(p.id, () => excluirPacote(p.id))}
                              disabled={ocupado}
                            >
                              {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                              Excluir pacote
                            </Botao>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                          <Botao
                            type="button"
                            variante="secundario"
                            tamanho="sm"
                            onClick={() => {
                              setAviso({});
                              setEdicao({ pacote: p });
                            }}
                            disabled={ocupado}
                          >
                            <Pencil className="size-3.5" /> Editar
                          </Botao>
                          <Botao
                            type="button"
                            variante="fantasma"
                            tamanho="sm"
                            onClick={() => executar(p.id, () => alterarSituacaoPacote(p.id, !p.ativo))}
                            disabled={ocupado}
                          >
                            {ocupado ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : p.ativo ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                            {p.ativo ? "Desativar" : "Ativar"}
                          </Botao>
                          <Botao
                            type="button"
                            variante="perigo"
                            tamanho="sm"
                            className="ml-auto"
                            onClick={() => setExcluindo(p.id)}
                            disabled={ocupado}
                          >
                            <Trash2 className="size-3.5" /> Excluir
                          </Botao>
                        </div>
                      )}
                    </div>
                  </div>
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}

      {edicao && (
        <DialogoPacote
          key={edicao.pacote?.id ?? "novo"}
          pacote={edicao.pacote}
          aoFechar={() => setEdicao(null)}
          aoSalvar={(mensagem) => {
            setEdicao(null);
            setAviso({ ok: true, mensagem });
          }}
        />
      )}
    </div>
  );
}

function DialogoPacote({ pacote, aoFechar, aoSalvar }: {
  pacote: Pacote | null;
  aoFechar: () => void;
  aoSalvar: (mensagem: string) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [estado, acao] = useActionState(async (anterior: EstadoAcao, form: FormData) => {
    const r = await salvarPacote(anterior, form);
    if (r.ok) aoSalvar(r.mensagem ?? "Pacote salvo.");
    return r;
  }, estadoInicial);
  const erros = estado.erros ?? {};
  const valor = (nome: string, atual: string) => estado.valores?.[nome] ?? atual;
  const ativo = estado.valores ? estado.valores.ativo === "on" : (pacote?.ativo ?? true);

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      onClose={aoFechar}
      aria-labelledby="titulo-pacote"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-[var(--radius-card)] bg-white p-0 shadow-lift backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
    >
      <form action={acao} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="titulo-pacote" className="text-lg font-semibold text-slate-900">
              {pacote ? "Editar pacote" : "Novo pacote"}
            </h2>
            <p className="text-sm text-slate-500">Nome, itens do cardápio, preço por pessoa e serviços adicionais.</p>
          </div>
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
          {pacote && <input type="hidden" name="id" value={pacote.id} />}
          {estado.mensagem && !estado.ok && (
            <Alerta tipo="erro">{estado.mensagem}</Alerta>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <Entrada
              rotulo="Nome do pacote"
              name="nome"
              required
              maxLength={80}
              placeholder="Ex.: Festa Completa"
              defaultValue={valor("nome", pacote?.nome ?? "")}
              erro={erros.nome}
              autoFocus
            />
            <Entrada
              rotulo="Preço por pessoa (R$)"
              name="preco_por_pessoa"
              required
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={valor("preco_por_pessoa", valorParaCampo(pacote?.preco_por_pessoa))}
              erro={erros.preco_por_pessoa}
            />
          </div>
          <AreaTexto
            rotulo="Itens do cardápio"
            name="itens_cardapio"
            required
            rows={4}
            placeholder="Coquetel de entrada, 2 pratos quentes, saladas, sobremesa"
            dica="Separe os itens por vírgula ou coloque um por linha."
            defaultValue={valor("itens_cardapio", pacote?.itens_cardapio ?? "")}
            erro={erros.itens_cardapio}
          />
          <AreaTexto
            rotulo="Serviços adicionais"
            name="servicos_adicionais"
            rows={2}
            placeholder="Ex.: Bolo decorado, DJ, decoração temática"
            defaultValue={valor("servicos_adicionais", pacote?.servicos_adicionais ?? "")}
            erro={erros.servicos_adicionais}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
            <input type="checkbox" name="ativo" defaultChecked={ativo} className="mt-0.5 size-4 accent-brand-600" />
            <span>
              <span className="block text-sm font-medium text-slate-800">Pacote ativo</span>
              <span className="block text-xs text-slate-500">Pacotes ativos aparecem no seu perfil público e podem ser escolhidos no orçamento.</span>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Botao type="button" variante="secundario" onClick={() => dialogo.current?.close()}>
            Cancelar
          </Botao>
          <BotaoEnviar textoEnviando="Salvando...">
            <Check className="size-4" /> {pacote ? "Salvar alterações" : "Criar pacote"}
          </BotaoEnviar>
        </div>
      </form>
    </dialog>
  );
}

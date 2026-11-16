"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowLeft, Check, CheckCheck, ClipboardList, Clock, SendHorizontal, Store } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataHora } from "@/lib/formatos";
import { BotaoLink } from "@/components/ui/botao";
import { AvatarContato } from "@/components/mensagens/avatar-contato";
import { diaDe, hora, rotuloDia } from "@/components/mensagens/datas";
import { LIMITE_MENSAGEM, type Contato, type ItemMensagem } from "@/components/mensagens/tipos";
import type { TipoUsuario } from "@/lib/database.types";

const SUGESTOES: Record<TipoUsuario, string[]> = {
  cliente: [
    "Olá! Gostaria de mais informações sobre os pacotes.",
    "Vocês têm data disponível para o meu evento?",
    "Quais serviços estão inclusos no valor por pessoa?",
  ],
  buffet: [
    "Olá! Obrigado pelo interesse no nosso buffet.",
    "Posso ajudar com alguma dúvida sobre a proposta?",
  ],
};

const INTERVALO_GRUPO = 5 * 60_000;

function CabecalhoConversa({ contato, meuTipo, base }: { contato: Contato; meuTipo: TipoUsuario; base: string }) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-4">
      <Link
        href={base}
        className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
        aria-label="Voltar para as conversas"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <AvatarContato nome={contato.nome} tipo={contato.tipo} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{contato.nome}</p>
        <p className="text-xs text-slate-500">{contato.tipo === "buffet" ? "Buffet" : "Cliente"}</p>
      </div>
      {contato.tipo === "buffet" && (
        <BotaoLink href={`/buffet/${contato.id}`} variante="secundario" tamanho="sm" aria-label="Ver perfil do buffet">
          <Store className="size-3.5" />
          <span className="hidden sm:inline">Ver perfil</span>
        </BotaoLink>
      )}
      {meuTipo === "buffet" && (
        <BotaoLink href="/anfitriao/solicitacoes" variante="secundario" tamanho="sm" aria-label="Ver solicitações de orçamento">
          <ClipboardList className="size-3.5" />
          <span className="hidden sm:inline">Solicitações</span>
        </BotaoLink>
      )}
    </header>
  );
}

function SeparadorDia({ dia }: { dia: string }) {
  return (
    <div className="my-4 flex justify-center first:mt-0">
      <span
        suppressHydrationWarning
        className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70 first-letter:uppercase"
      >
        {rotuloDia(dia)}
      </span>
    </div>
  );
}

function StatusEnvio({ mensagem }: { mensagem: ItemMensagem }) {
  if (mensagem.estado === "enviando") return <Clock className="size-3" aria-label="Enviando" />;
  if (mensagem.estado === "erro") return <AlertCircle className="size-3.5 text-red-500" aria-label="Não enviada" />;
  if (mensagem.lida) return <CheckCheck className="size-3.5 text-accent-300" aria-label="Lida" />;
  return <Check className="size-3.5" aria-label="Enviada" />;
}

function Bolha({ mensagem, minha, inicioGrupo, onTentarDeNovo, onDescartar }: {
  mensagem: ItemMensagem;
  minha: boolean;
  inicioGrupo: boolean;
  onTentarDeNovo: (id: string) => void;
  onDescartar: (id: string) => void;
}) {
  const falhou = mensagem.estado === "erro";
  const cores = falhou
    ? "bg-red-50 text-red-900 ring-1 ring-red-200"
    : minha
      ? "bg-brand-600 text-white"
      : "bg-white text-slate-800 ring-1 ring-slate-200/80";
  return (
    <div className={cn("flex flex-col", minha ? "items-end" : "items-start", inicioGrupo ? "mt-3" : "mt-1")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 pb-1.5 pt-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
          cores,
          inicioGrupo && (minha ? "rounded-tr-md" : "rounded-tl-md"),
          mensagem.estado === "enviando" && "opacity-75",
        )}
      >
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{mensagem.conteudo}</p>
        <span
          className={cn(
            "mt-0.5 flex items-center justify-end gap-1 text-[11px]",
            minha && !falhou ? "text-brand-100" : "text-slate-400",
          )}
        >
          <time dateTime={mensagem.data_envio} title={dataHora(mensagem.data_envio)}>
            {hora(mensagem.data_envio)}
          </time>
          {minha && <StatusEnvio mensagem={mensagem} />}
        </span>
      </div>
      {falhou && (
        <div className="mt-1 flex max-w-[85%] flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-xs sm:max-w-[70%]">
          <span className="text-right text-red-600">Mensagem não enviada. {mensagem.erro}</span>
          <button
            type="button"
            onClick={() => onTentarDeNovo(mensagem.id)}
            className="font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Tentar de novo
          </button>
          <button type="button" onClick={() => onDescartar(mensagem.id)} className="text-slate-500 underline-offset-2 hover:underline">
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}

function ConversaVazia({ contato, meuTipo, onEscolher }: {
  contato: Contato;
  meuTipo: TipoUsuario;
  onEscolher: (texto: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
      <AvatarContato nome={contato.nome} tipo={contato.tipo} className="size-16 text-lg ring-8 ring-white" />
      <p className="mt-4 font-semibold text-slate-900">Comece a conversa com {contato.nome}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {meuTipo === "cliente"
          ? "Tire dúvidas sobre cardápio, datas e serviços. O buffet é avisado assim que você enviar."
          : "Você pode escrever para clientes que já pediram orçamento ao seu buffet."}
      </p>
      <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
        {SUGESTOES[meuTipo].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onEscolher(s)}
            className="rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  contato: Contato;
  meuId: string;
  meuTipo: TipoUsuario;
  base: string;
  mensagens: ItemMensagem[];
  onEnviar: (texto: string) => void;
  onTentarDeNovo: (id: string) => void;
  onDescartar: (id: string) => void;
};

export function Conversa({ contato, meuId, meuTipo, base, mensagens, onEnviar, onTentarDeNovo, onDescartar }: Props) {
  const [rascunho, setRascunho] = useState("");
  const [erroCampo, setErroCampo] = useState("");
  const [noFim, setNoFim] = useState(true);
  const ultima = mensagens.at(-1);
  const [vistaAte, setVistaAte] = useState(ultima?.id);
  const listaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const rolouAte = useRef<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) campoRef.current?.focus();
  }, []);

  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = "auto";
    campo.style.height = `${Math.min(campo.scrollHeight, 160)}px`;
  }, [rascunho]);

  useEffect(() => {
    const lista = listaRef.current;
    const id = ultima?.id ?? "";
    if (!lista || rolouAte.current === id) return;
    const primeiraVez = rolouAte.current === null;
    rolouAte.current = id;
    if (primeiraVez || noFim || ultima?.remetente_id === meuId) {
      lista.scrollTo({ top: lista.scrollHeight, behavior: primeiraVez ? "auto" : "smooth" });
    }
  }, [ultima?.id, ultima?.remetente_id, meuId, noFim]);

  function aoRolar() {
    const lista = listaRef.current;
    if (!lista) return;
    const fim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
    if (fim !== noFim) setNoFim(fim);
    if (fim && ultima && vistaAte !== ultima.id) setVistaAte(ultima.id);
  }

  function irParaOFim() {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }

  function enviar() {
    const texto = rascunho.trim();
    if (!texto) {
      setErroCampo("A mensagem não pode ficar em branco.");
      campoRef.current?.focus();
      return;
    }
    if (texto.length > LIMITE_MENSAGEM) {
      setErroCampo(`A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres.`);
      return;
    }
    setErroCampo("");
    setRascunho("");
    onEnviar(texto);
  }

  function escolherSugestao(texto: string) {
    setRascunho(texto);
    setErroCampo("");
    campoRef.current?.focus();
  }

  const temNovas = !noFim && !!ultima && ultima.id !== vistaAte && ultima.remetente_id !== meuId;
  const tamanho = rascunho.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CabecalhoConversa contato={contato} meuTipo={meuTipo} base={base} />

      <div className="relative min-h-0 flex-1">
        <div
          ref={listaRef}
          onScroll={aoRolar}
          className="h-full overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-5"
          role="log"
          aria-live="polite"
          aria-label={`Mensagens com ${contato.nome}`}
        >
          {mensagens.length === 0 ? (
            <ConversaVazia contato={contato} meuTipo={meuTipo} onEscolher={escolherSugestao} />
          ) : (
            mensagens.map((m, i) => {
              const anterior = mensagens[i - 1];
              const dia = diaDe(m.data_envio);
              const novoDia = !anterior || diaDe(anterior.data_envio) !== dia;
              const inicioGrupo =
                novoDia ||
                anterior.remetente_id !== m.remetente_id ||
                new Date(m.data_envio).getTime() - new Date(anterior.data_envio).getTime() > INTERVALO_GRUPO;
              return (
                <Fragment key={m.id}>
                  {novoDia && <SeparadorDia dia={dia} />}
                  <Bolha
                    mensagem={m}
                    minha={m.remetente_id === meuId}
                    inicioGrupo={inicioGrupo}
                    onTentarDeNovo={onTentarDeNovo}
                    onDescartar={onDescartar}
                  />
                </Fragment>
              );
            })
          )}
        </div>

        {!noFim && (
          <button
            type="button"
            onClick={irParaOFim}
            className={cn(
              "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lift transition",
              temNovas ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900",
            )}
          >
            <ArrowDown className="size-3.5" />
            {temNovas ? "Novas mensagens" : "Ir para o fim"}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="border-t border-slate-100 bg-white p-3"
      >
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-white py-1.5 pl-3.5 pr-1.5 shadow-sm transition focus-within:ring-4",
            erroCampo ? "border-red-400 focus-within:ring-red-100" : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-100",
          )}
        >
          <textarea
            ref={campoRef}
            value={rascunho}
            onChange={(e) => {
              setRascunho(e.target.value);
              if (erroCampo) setErroCampo("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                enviar();
              }
            }}
            rows={1}
            maxLength={LIMITE_MENSAGEM}
            enterKeyHint="send"
            placeholder={`Escreva para ${contato.nome}…`}
            aria-label="Mensagem"
            aria-invalid={!!erroCampo}
            aria-describedby="ajuda-mensagem"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl transition active:scale-95",
              rascunho.trim() ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700" : "bg-slate-100 text-slate-400",
            )}
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
        <div id="ajuda-mensagem" className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px]">
          {erroCampo ? (
            <span role="alert" className="font-medium text-red-600">
              {erroCampo}
            </span>
          ) : (
            <span className="hidden text-slate-400 sm:inline">
              <kbd className="font-sans font-semibold">Enter</kbd> envia · <kbd className="font-sans font-semibold">Shift + Enter</kbd> quebra a linha
            </span>
          )}
          <span
            className={cn(
              "ml-auto tabular-nums",
              tamanho >= LIMITE_MENSAGEM ? "font-semibold text-red-600" : tamanho > LIMITE_MENSAGEM * 0.9 ? "text-amber-600" : "text-slate-400",
            )}
          >
            {tamanho}/{LIMITE_MENSAGEM}
          </span>
        </div>
      </form>
    </div>
  );
}

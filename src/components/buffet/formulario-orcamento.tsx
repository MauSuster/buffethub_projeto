"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Calculator,
  Check,
  ClipboardList,
  Loader2,
  MapPin,
  PartyPopper,
  Plus,
  Send,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { AreaTexto, Entrada, Selecao } from "@/components/ui/campos";
import { MensagemAcao } from "@/components/ui/basicos";
import { solicitarOrcamento } from "@/controllers/orcamento";
import { estadoInicial } from "@/lib/acoes";
import { cn } from "@/lib/cn";
import { data as dataBR, dataPorExtenso, moeda } from "@/lib/formatos";
import type { DataIndisponivel } from "@/models/perfil-buffet";

export type PacoteOpcao = { id: string; nome: string; preco_por_pessoa: number; itens_cardapio: string };
export type EventoOpcao = {
  id: string;
  tipo_evento: string;
  data: string;
  local: string;
  num_convidados: number;
  servicos_desejados: string | null;
  jaSolicitado: boolean;
};

type Props = {
  buffetId: string;
  tiposEvento: string[];
  servicosBuffet: string[];
  capacidade: number | null;
  pacotes: PacoteOpcao[];
  indisponiveis: DataIndisponivel[];
  eventos: EventoOpcao[];
  amanha: string;
  pacoteInicial?: string;
  dataInicial?: string;
};

type Problema = { mensagem: string; erros: Record<string, string> };

const TIPOS_PADRAO = ["Casamento", "Aniversário", "15 anos", "Infantil", "Corporativo", "Formatura"];
const SERVICOS_PADRAO = ["Decoração", "Garçons", "Bebidas", "Bolo e doces", "DJ / som", "Fotografia"];
const LOCAL_BUFFET = "No próprio buffet";
const MAX_OBSERVACOES = 1000;

function TituloBloco({ numero, titulo, descricao }: { numero: number; titulo: string; descricao?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{numero}</span>
      <div>
        <h2 className="text-base font-bold uppercase tracking-wide text-brand-700">{titulo}</h2>
        {descricao && <p className="text-sm text-slate-500">{descricao}</p>}
      </div>
    </div>
  );
}

/** T5.1 Solicitar Orçamento: UC08 com o UC09 (cadastrar evento ou usar um já cadastrado) incluído. */
export function FormularioOrcamento({
  buffetId,
  tiposEvento,
  servicosBuffet,
  capacidade,
  pacotes,
  indisponiveis,
  eventos,
  amanha,
  pacoteInicial,
  dataInicial,
}: Props) {
  const acao = useMemo(() => solicitarOrcamento.bind(null, buffetId), [buffetId]);
  const [estado, enviar, enviando] = useActionState(acao, estadoInicial);

  const [modo, setModo] = useState<"novo" | "existente">("novo");
  const [eventoId, setEventoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [tipoOutro, setTipoOutro] = useState("");
  const [dataEvento, setDataEvento] = useState(dataInicial ?? "");
  const [local, setLocal] = useState("");
  const [convidados, setConvidados] = useState("");
  const [servicos, setServicos] = useState<string[]>([]);
  const [outrosServicos, setOutrosServicos] = useState("");
  const [pacoteId, setPacoteId] = useState(pacoteInicial ?? "");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    setErros(estado.erros ?? {});
    setMensagem(estado.mensagem ?? null);
    if (estado.valores?.modo === "existente" && estado.valores.evento_id) {
      setModo("existente");
      setEventoId(estado.valores.evento_id);
    }
  }

  const ocupadas = useMemo(() => new Map(indisponiveis.map((d) => [d.data, d.status])), [indisponiveis]);
  const tipos = tiposEvento.length > 0 ? tiposEvento : TIPOS_PADRAO;
  const opcoesServico = servicosBuffet.length > 0 ? servicosBuffet : SERVICOS_PADRAO;

  const eventoEscolhido = eventos.find((e) => e.id === eventoId);
  const qtdConvidados = modo === "novo" ? Number(convidados) : (eventoEscolhido?.num_convidados ?? 0);
  const pacote = pacotes.find((p) => p.id === pacoteId);
  const estimativa = pacote && qtdConvidados > 0 ? pacote.preco_por_pessoa * qtdConvidados : null;
  const servicosTexto = [...servicos, outrosServicos.trim()].filter(Boolean).join(", ");

  const situacaoData = !dataEvento ? null : dataEvento < amanha ? "passada" : ocupadas.has(dataEvento) ? "ocupada" : "livre";
  const acimaCapacidade = capacidade != null && Number(convidados) > capacidade;

  const avisoData =
    situacaoData === "ocupada"
      ? "O buffet não está disponível nesta data."
      : situacaoData === "passada"
        ? "Escolha uma data a partir de amanhã."
        : undefined;
  const avisoConvidados = acimaCapacidade ? `Este buffet atende no máximo ${capacidade} convidados.` : undefined;

  function problemaDoEvento(e: EventoOpcao) {
    if (e.jaSolicitado) return "Você já pediu orçamento deste buffet para este evento.";
    if (ocupadas.has(e.data)) return "O buffet não está disponível nesta data.";
    if (capacidade != null && e.num_convidados > capacidade) return `Acima da capacidade do buffet (${capacidade} convidados).`;
    return null;
  }

  function limparErro(campo: string) {
    if (!erros[campo]) return;
    setErros((atuais) => {
      const copia = { ...atuais };
      delete copia[campo];
      return copia;
    });
  }

  function validar(): Problema | null {
    if (modo === "existente") {
      if (!eventoEscolhido) return { mensagem: "Escolha um dos seus eventos ou cadastre um novo.", erros: { evento_id: "Escolha um evento." } };
      const problema = problemaDoEvento(eventoEscolhido);
      return problema ? { mensagem: problema, erros: { evento_id: problema } } : null;
    }
    const faltando: Record<string, string> = {};
    if (!tipo) faltando.tipo_evento = "Escolha o tipo de evento.";
    else if (tipo === "Outro" && !tipoOutro.trim()) faltando.tipo_outro = "Informe o tipo de evento.";
    if (!dataEvento) faltando.data = "Informe a data do evento.";
    if (!local.trim()) faltando.local = "Informe o local do evento.";
    if (!convidados) faltando.num_convidados = "Informe o número de convidados.";
    if (Object.keys(faltando).length) return { mensagem: "Preencha todos os campos obrigatórios.", erros: faltando };

    const invalidos: Record<string, string> = {};
    if (situacaoData === "passada") invalidos.data = "Escolha uma data a partir de amanhã.";
    const n = Number(convidados);
    if (!Number.isInteger(n) || n < 1 || acimaCapacidade) {
      invalidos.num_convidados = capacidade != null ? `Informe de 1 a ${capacidade} convidados.` : "Informe um número maior que zero.";
    }
    if (Object.keys(invalidos).length) {
      return { mensagem: "Informe uma data futura e um número de convidados entre 1 e a capacidade do buffet.", erros: invalidos };
    }
    if (situacaoData === "ocupada") {
      return { mensagem: "O buffet não está disponível nesta data.", erros: { data: "Data indisponível neste buffet. Escolha outra." } };
    }
    return null;
  }

  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problema = validar();
    setErros(problema?.erros ?? {});
    setMensagem(problema?.mensagem ?? null);
    if (problema) {
      document.getElementById(Object.keys(problema.erros)[0])?.focus();
      return;
    }
    const dados = new FormData(e.currentTarget);
    startTransition(() => enviar(dados));
  }

  function alternarServico(s: string) {
    setServicos((lista) => (lista.includes(s) ? lista.filter((x) => x !== s) : [...lista, s]));
  }

  const algumJaSolicitado = eventos.some((e) => e.jaSolicitado);

  return (
    <form onSubmit={aoEnviar} noValidate className="space-y-6">
      <input type="hidden" name="modo" value={modo} />

      <section className="card p-5 sm:p-7">
        <TituloBloco numero={1} titulo="Dados do evento" descricao="Tipo, data, local e quantas pessoas você espera." />

        {eventos.length > 0 && (
          <div role="radiogroup" aria-label="Origem dos dados do evento" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
            {(
              [
                ["novo", "Cadastrar novo evento"],
                ["existente", `Usar evento já cadastrado (${eventos.length})`],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={modo === valor}
                onClick={() => {
                  setModo(valor);
                  setErros({});
                  setMensagem(null);
                }}
                className={cn(
                  "rounded-xl px-3 py-2.5 transition",
                  modo === valor ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {modo === "existente" ? (
          <fieldset id="evento_id" tabIndex={-1} className="space-y-3 outline-none">
            <legend className="sr-only">Escolha um dos seus eventos</legend>
            {algumJaSolicitado && (
              <p className="text-sm text-slate-500">
                Eventos que já têm pedido para este buffet aparecem desativados. Acompanhe em{" "}
                <Link href="/cliente/solicitacoes" className="font-semibold text-brand-700 hover:underline">
                  Solicitações e propostas
                </Link>
                .
              </p>
            )}
            {eventos.map((ev) => {
              const problema = problemaDoEvento(ev);
              const marcado = eventoId === ev.id;
              return (
                <label
                  key={ev.id}
                  className={cn(
                    "flex gap-4 rounded-2xl border p-4 transition",
                    problema ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70" : "cursor-pointer hover:border-brand-300",
                    marcado && !problema ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-100" : "border-slate-200",
                  )}
                >
                  <input
                    type="radio"
                    name="evento_id"
                    value={ev.id}
                    checked={marcado}
                    disabled={!!problema}
                    onChange={() => {
                      setEventoId(ev.id);
                      limparErro("evento_id");
                    }}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-slate-900">{ev.tipo_evento}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <CalendarDays className="size-4 text-slate-400" /> {dataPorExtenso(ev.data)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4 text-slate-400" /> {ev.local}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-4 text-slate-400" /> {ev.num_convidados} convidados
                      </span>
                    </div>
                    {ev.servicos_desejados && <p className="text-xs text-slate-500">Serviços: {ev.servicos_desejados}</p>}
                    {problema && <p className="text-xs font-semibold text-red-600">{problema}</p>}
                  </div>
                </label>
              );
            })}
            {erros.evento_id && <p className="text-xs font-medium text-red-600">{erros.evento_id}</p>}
          </fieldset>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-3">
                <Selecao
                  rotulo="Tipo de evento"
                  name="tipo_evento"
                  required
                  value={tipo}
                  erro={erros.tipo_evento}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    limparErro("tipo_evento");
                  }}
                >
                  <option value="" disabled>
                    Selecione o tipo
                  </option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="Outro">Outro</option>
                </Selecao>
                {tipo === "Outro" && (
                  <Entrada
                    rotulo="Qual é o tipo de evento?"
                    name="tipo_outro"
                    required
                    maxLength={60}
                    placeholder="Ex.: Chá de bebê, bodas de prata"
                    value={tipoOutro}
                    erro={erros.tipo_outro}
                    onChange={(e) => {
                      setTipoOutro(e.target.value);
                      limparErro("tipo_outro");
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Entrada
                  rotulo="Data do evento"
                  name="data"
                  type="date"
                  required
                  min={amanha}
                  value={dataEvento}
                  erro={erros.data ?? avisoData}
                  onChange={(e) => {
                    setDataEvento(e.target.value);
                    limparErro("data");
                  }}
                />
                {situacaoData === "livre" && !erros.data && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                    <CalendarCheck className="size-3.5 shrink-0" />
                    <span>
                      <span className="capitalize">{dataPorExtenso(dataEvento)}</span> está livre na agenda
                    </span>
                  </p>
                )}
                {situacaoData === "ocupada" && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarX className="size-3.5 shrink-0" /> Veja as datas livres no calendário do perfil do buffet.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Entrada
                  rotulo="Local"
                  name="local"
                  required
                  maxLength={200}
                  placeholder='Endereço ou "No próprio buffet"'
                  value={local}
                  erro={erros.local}
                  onChange={(e) => {
                    setLocal(e.target.value);
                    limparErro("local");
                  }}
                />
                {local !== LOCAL_BUFFET && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocal(LOCAL_BUFFET);
                      limparErro("local");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    <Plus className="size-3" /> {LOCAL_BUFFET}
                  </button>
                )}
              </div>

              <Entrada
                rotulo="Nº de convidados"
                name="num_convidados"
                type="number"
                inputMode="numeric"
                required
                min={1}
                max={capacidade ?? undefined}
                placeholder="Ex.: 120"
                value={convidados}
                erro={erros.num_convidados ?? avisoConvidados}
                dica={capacidade != null ? `Capacidade máxima: ${capacidade} convidados.` : undefined}
                onChange={(e) => {
                  setConvidados(e.target.value);
                  limparErro("num_convidados");
                }}
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Serviços desejados</legend>
              <div className="flex flex-wrap gap-2">
                {opcoesServico.map((s) => {
                  const marcado = servicos.includes(s);
                  return (
                    <label
                      key={s}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
                        marcado ? "border-brand-500 bg-brand-600 text-white shadow-sm" : "border-slate-300 bg-white text-slate-700 hover:border-brand-300",
                      )}
                    >
                      <input type="checkbox" className="sr-only" checked={marcado} onChange={() => alternarServico(s)} />
                      {marcado ? <Check className="size-4" /> : <Plus className="size-4 text-slate-400" />}
                      {s}
                    </label>
                  );
                })}
              </div>
              <Entrada
                rotulo="Outros serviços (opcional)"
                name="outros_servicos"
                classeContainer="mt-3"
                maxLength={300}
                placeholder="Ex.: mesa de frios, fotógrafo, cerimonialista"
                value={outrosServicos}
                onChange={(e) => setOutrosServicos(e.target.value)}
              />
              <input type="hidden" name="servicos_desejados" value={servicosTexto} />
            </fieldset>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-7">
        <TituloBloco numero={2} titulo="Pacote e observações" descricao="O pacote é opcional: ajuda o buffet a montar a proposta." />

        <fieldset id="pacote_id" tabIndex={-1} className="outline-none">
          <legend className="mb-2 text-sm font-medium text-slate-700">Pacote de interesse (opcional)</legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[{ id: "", nome: "Ainda não sei", preco_por_pessoa: 0, itens_cardapio: "O buffet sugere o melhor cardápio." }, ...pacotes].map((p) => {
              const marcado = pacoteId === p.id;
              return (
                <label
                  key={p.id || "nenhum"}
                  className={cn(
                    "relative flex cursor-pointer flex-col rounded-2xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
                    marcado ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-100" : "border-slate-200 hover:border-brand-300",
                  )}
                >
                  <input
                    type="radio"
                    name="pacote_id"
                    value={p.id}
                    checked={marcado}
                    onChange={() => {
                      setPacoteId(p.id);
                      limparErro("pacote_id");
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2",
                        marcado ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300",
                      )}
                    >
                      {marcado && <Check className="size-3" />}
                    </span>
                    <span className="font-semibold text-slate-900">{p.nome}</span>
                  </span>
                  {p.id ? (
                    <span className="mt-2 text-sm text-slate-600">
                      <b className="text-brand-700">{moeda(p.preco_por_pessoa)}</b> por pessoa
                    </span>
                  ) : null}
                  <span className="mt-1 line-clamp-2 text-xs text-slate-500">{p.itens_cardapio}</span>
                </label>
              );
            })}
          </div>
          {erros.pacote_id && <p className="mt-2 text-xs font-medium text-red-600">{erros.pacote_id}</p>}
        </fieldset>

        <div className="mt-5 flex items-start gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-soft">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
            <Calculator className="size-5" />
          </span>
          <div className="min-w-0" aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">Estimativa</p>
            {estimativa != null && pacote ? (
              <>
                <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{moeda(estimativa)}</p>
                <p className="text-sm text-brand-100">
                  {moeda(pacote.preco_por_pessoa)} × {qtdConvidados} convidados · pacote {pacote.nome}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-brand-50">
                {pacotes.length === 0
                  ? "Este buffet ainda não publicou pacotes. O valor vem na proposta."
                  : "Escolha um pacote e informe o número de convidados para ver uma estimativa."}
              </p>
            )}
            <p className="mt-2 text-xs text-brand-100/80">Valor de referência. O preço final vem na proposta do buffet.</p>
          </div>
        </div>

        <AreaTexto
          rotulo="Observações"
          name="observacoes"
          classeContainer="mt-5"
          maxLength={MAX_OBSERVACOES}
          placeholder="Conte detalhes importantes: horário, restrições alimentares, tema da festa…"
          value={observacoes}
          erro={erros.observacoes}
          dica={`${observacoes.length}/${MAX_OBSERVACOES} caracteres`}
          onChange={(e) => {
            setObservacoes(e.target.value);
            limparErro("observacoes");
          }}
        />
      </section>

      <div className="card space-y-4 p-5 sm:p-6">
        {modo === "existente" && eventoEscolhido && (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <PartyPopper className="size-4 text-accent-500" />
            {eventoEscolhido.tipo_evento} em {dataBR(eventoEscolhido.data)} para {eventoEscolhido.num_convidados} convidados
          </p>
        )}
        <MensagemAcao estado={{ ok: false, mensagem: mensagem ?? undefined }} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ClipboardList className="size-4 shrink-0" />
            O pedido vai para o buffet e aparece em Solicitações e propostas.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <BotaoLink href={`/buffet/${buffetId}`} variante="secundario" tamanho="lg">
              Cancelar
            </BotaoLink>
            <Botao type="submit" tamanho="lg" disabled={enviando}>
              {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {enviando ? "Enviando…" : "Enviar solicitação"}
            </Botao>
          </div>
        </div>
        {pacotes.length > 0 && !pacote && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <UtensilsCrossed className="size-3.5" /> Dica: escolher um pacote agiliza a resposta do buffet.
          </p>
        )}
      </div>
    </form>
  );
}

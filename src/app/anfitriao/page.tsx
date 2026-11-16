import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileSignature,
  Hourglass,
  Inbox,
  MapPin,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { exigirBuffet } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { dataPorExtenso, hojeISO, moeda, tempoRelativo, data as dataBR } from "@/lib/formatos";
import { Avatar, Cartao, Estrelas, Vazio } from "@/components/ui/basicos";
import { ErroCarregamento, EsqueletoInicio } from "@/components/anfitriao/estados";
import { diasAte, nomeCurtoDoMes } from "@/components/anfitriao/datas";
import * as modelo from "@/models/anfitriao";

export const metadata = { title: "Painel do anfitrião" };

// T8.0 Painel do Anfitrião
export default function InicioAnfitriao() {
  return (
    <Suspense fallback={<EsqueletoInicio />}>
      <Painel />
    </Suspense>
  );
}

const CORES = {
  amarelo: "bg-amber-50 text-amber-600 ring-amber-100",
  azul: "bg-brand-50 text-brand-600 ring-brand-100",
  roxo: "bg-violet-50 text-violet-600 ring-violet-100",
  verde: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  ambar: "bg-accent-50 text-accent-600 ring-accent-100",
  cinza: "bg-slate-100 text-slate-600 ring-slate-200",
};

function CartaoResumo({ href, Icone, cor, valor, rotulo, detalhe }: {
  href: string;
  Icone: LucideIcon;
  cor: keyof typeof CORES;
  valor: React.ReactNode;
  rotulo: string;
  detalhe?: string;
}) {
  return (
    <Link href={href} className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <span className={cn("grid size-11 place-items-center rounded-2xl ring-1 ring-inset", CORES[cor])}>
          <Icone className="size-5" />
        </span>
        <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{valor}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-600">{rotulo}</p>
        {detalhe && <p className="mt-1 text-xs text-slate-400">{detalhe}</p>}
      </div>
    </Link>
  );
}

function plural(n: number, singular: string, varios: string) {
  return `${n} ${n === 1 ? singular : varios}`;
}

async function Painel() {
  const sessao = await exigirBuffet("/anfitriao");
  await modelo.atualizarStatusPorData();
  const [negociacoes, avaliacoes, perfil, pacotes, fotos] = await Promise.all([
    modelo.listarNegociacoes(sessao.id),
    modelo.obterResumoAvaliacoes(sessao.id),
    modelo.obterPerfilBuffet(sessao.id),
    modelo.listarPacotes(sessao.id),
    modelo.listarFotos(sessao.id),
  ]);
  const erro = negociacoes.erro ?? avaliacoes.erro ?? perfil.erro ?? pacotes.erro ?? fotos.erro;
  if (erro) return <ErroCarregamento mensagem={erro} />;

  const hoje = hojeISO();
  const lista = negociacoes.dados;
  const pendentes = lista.filter((n) => n.status_solicitacao === "Pendente");
  const aguardandoCliente = lista.filter((n) => n.status_proposta === "Pendente");
  const aguardandoAssinatura = lista.filter((n) => n.status_contrato === "Aguardando assinatura");
  const aguardandoPagamento = lista.filter((n) => n.status_contrato === "Assinado");
  const proximos = lista
    .filter((n) => n.status_contrato === "Pago" && n.data_evento >= hoje)
    .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  const receita = lista
    .filter((n) => n.status_contrato === "Pago" || n.status_contrato === "Concluído")
    .reduce((total, n) => total + Number(n.valor_total ?? 0), 0);
  const { notaMedia, total: totalAvaliacoes } = avaliacoes.dados;

  const buffet = perfil.dados?.buffet;
  const checklist = [
    { ok: !!buffet?.descricao, rotulo: "Descrição do buffet", href: "/anfitriao/dados" },
    { ok: !!(buffet?.endereco && buffet?.cidade), rotulo: "Endereço e cidade", href: "/anfitriao/dados" },
    { ok: buffet?.latitude != null, rotulo: "Localização no mapa", href: "/anfitriao/dados" },
    {
      ok: !!buffet?.capacidade_maxima && (buffet?.tipos_evento.length ?? 0) > 0,
      rotulo: "Capacidade e tipos de evento",
      href: "/anfitriao/dados",
    },
    { ok: fotos.dados.length > 0, rotulo: "Fotos no portfólio", href: "/anfitriao/dados#portfolio" },
    { ok: pacotes.dados.some((p) => p.ativo), rotulo: "Pacote ativo no cardápio", href: "/anfitriao/cardapio" },
  ];
  const completos = checklist.filter((c) => c.ok).length;
  const extenso = dataPorExtenso(hoje);

  return (
    <div className="space-y-6">
      <section className="hero-gradient relative overflow-hidden rounded-[var(--radius-card)] p-6 text-white shadow-lift sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-white/70">{extenso[0].toUpperCase() + extenso.slice(1)}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Olá, {sessao.nomeExibicao}!</h1>
            <p className="mt-2 text-white/80">
              {pendentes.length > 0
                ? `Você tem ${plural(pendentes.length, "pedido de orçamento", "pedidos de orçamento")} esperando resposta.`
                : "Nenhum pedido esperando resposta. Tudo em dia por aqui!"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {pendentes.length > 0 && (
                <Link
                  href="/anfitriao/solicitacoes"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-400 px-4 text-sm font-semibold text-brand-950 shadow-sm transition hover:bg-accent-300"
                >
                  <Inbox className="size-4" /> Responder pedidos
                </Link>
              )}
              <Link
                href={`/buffet/${sessao.id}`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur transition hover:bg-white/20"
              >
                Ver meu perfil público <ExternalLink className="size-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-inset ring-white/20 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Sua nota</p>
            {notaMedia != null ? (
              <div className="mt-1 flex items-center gap-3">
                <span className="text-4xl font-bold">{notaMedia.toFixed(1).replace(".", ",")}</span>
                <div>
                  <Estrelas nota={notaMedia} />
                  <p className="mt-0.5 text-xs text-white/70">{plural(totalAvaliacoes, "avaliação", "avaliações")}</p>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/80">Ainda sem avaliações</p>
            )}
          </div>
        </div>
      </section>

      {completos < checklist.length && (
        <Cartao className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Complete o perfil do seu buffet</h2>
              <p className="text-sm text-slate-500">Perfis completos aparecem melhor na busca e recebem mais pedidos.</p>
            </div>
            <span className="text-sm font-semibold text-brand-700">
              {completos} de {checklist.length}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
              style={{ width: `${(completos / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {checklist.map((item) => (
              <li key={item.rotulo}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    item.ok ? "text-slate-400" : "bg-slate-50 font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  {item.ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-300" />}
                  <span className={cn(item.ok && "line-through")}>{item.rotulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CartaoResumo
          href="/anfitriao/solicitacoes?aba=pendentes"
          Icone={Inbox}
          cor="amarelo"
          valor={pendentes.length}
          rotulo="Solicitações pendentes"
          detalhe="Esperando a sua proposta"
        />
        <CartaoResumo
          href="/anfitriao/solicitacoes?aba=respondidas"
          Icone={Hourglass}
          cor="azul"
          valor={aguardandoCliente.length}
          rotulo="Propostas aguardando o cliente"
          detalhe="O cliente ainda vai aceitar ou recusar"
        />
        <CartaoResumo
          href="/anfitriao/solicitacoes?aba=respondidas"
          Icone={FileSignature}
          cor="roxo"
          valor={aguardandoPagamento.length}
          rotulo="Contratos assinados aguardando pagamento"
          detalhe={
            aguardandoAssinatura.length > 0
              ? `${plural(aguardandoAssinatura.length, "outro contrato aguarda", "outros contratos aguardam")} assinatura`
              : undefined
          }
        />
        <CartaoResumo
          href="/anfitriao/calendario"
          Icone={CalendarCheck2}
          cor="verde"
          valor={proximos.length}
          rotulo="Próximos eventos reservados"
          detalhe={proximos[0] ? `O próximo é em ${dataBR(proximos[0].data_evento)}` : undefined}
        />
        <CartaoResumo
          href={`/buffet/${sessao.id}`}
          Icone={Star}
          cor="ambar"
          valor={notaMedia != null ? notaMedia.toFixed(1).replace(".", ",") : "—"}
          rotulo="Nota média"
          detalhe={plural(totalAvaliacoes, "avaliação recebida", "avaliações recebidas")}
        />
        <CartaoResumo
          href="/anfitriao/solicitacoes?aba=respondidas"
          Icone={Wallet}
          cor="cinza"
          valor={<span className="text-2xl sm:text-3xl">{moeda(receita)}</span>}
          rotulo="Contratos pagos"
          detalhe="Soma dos contratos pagos e concluídos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Próximos eventos</h2>
            <Link href="/anfitriao/calendario" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Ver calendário
            </Link>
          </div>
          {proximos.length === 0 ? (
            <Vazio
              Icone={CalendarDays}
              titulo="Nenhum evento reservado"
              texto="As datas aparecem aqui quando o cliente paga o contrato."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {proximos.slice(0, 5).map((n) => {
                const dias = diasAte(n.data_evento, hoje);
                return (
                  <li key={n.solicitacao_id}>
                    <Link
                      href={`/anfitriao/solicitacoes?aba=respondidas&id=${n.solicitacao_id}`}
                      className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                    >
                      <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-brand-50 py-1.5 text-brand-700">
                        <span className="text-xl font-bold leading-none">{n.data_evento.slice(8, 10)}</span>
                        <span className="text-[11px] font-semibold uppercase">{nomeCurtoDoMes(n.data_evento)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {n.tipo_evento} · {n.cliente_nome ?? "Cliente"}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" /> {n.num_convidados} convidados
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{n.local}</span>
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-800">{moeda(n.valor_total)}</p>
                        <p className="text-xs text-slate-400">{dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>

        <Cartao className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Pedidos aguardando resposta</h2>
            <Link href="/anfitriao/solicitacoes" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Ver todos
            </Link>
          </div>
          {pendentes.length === 0 ? (
            <Vazio Icone={Inbox} titulo="Nenhum pedido pendente" texto="Quando um cliente pedir orçamento, ele aparece aqui." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendentes.slice(0, 5).map((n) => (
                <li key={n.solicitacao_id}>
                  <Link
                    href={`/anfitriao/solicitacoes?aba=pendentes&id=${n.solicitacao_id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                  >
                    <Avatar nome={n.cliente_nome ?? "Cliente"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{n.cliente_nome ?? "Cliente"}</p>
                      <p className="truncate text-xs text-slate-500">
                        {n.tipo_evento} · {dataBR(n.data_evento)} · {n.num_convidados} convidados
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{tempoRelativo(n.data_solicitacao)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}

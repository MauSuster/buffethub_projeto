import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChefHat,
  ExternalLink,
  Info,
  MapPin,
  MessageSquareQuote,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { obterSessao } from "@/lib/auth";
import { hojeISO } from "@/lib/formatos";
import { buscarPerfilBuffet } from "@/models/perfil-buffet";
import { Alerta, Estrelas, Selo } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { Galeria } from "@/components/buffet/galeria";
import { CalendarioDisponibilidade } from "@/components/buffet/calendario-disponibilidade";
import { ListaPacotes } from "@/components/buffet/pacotes";
import { Avaliacoes } from "@/components/buffet/avaliacoes";
import { BarraReservaMovel, CartaoReserva, type Visitante } from "@/components/buffet/barra-reserva";
import { Secao, formatarNota, separarItens } from "@/components/buffet/secao";
import type { BuffetBusca } from "@/lib/database.types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resultado = await buscarPerfilBuffet(id);
  if (resultado.situacao !== "ok") return { title: "Buffet" };
  const { buffet } = resultado.perfil;
  return { title: buffet.nome_fantasia, description: buffet.descricao ?? undefined };
}

const ATALHOS = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#disponibilidade", rotulo: "Datas livres" },
  { href: "#avaliacoes", rotulo: "Avaliações" },
  { href: "#localizacao", rotulo: "Localização" },
];

function linkMapa(b: BuffetBusca) {
  if (b.latitude != null && b.longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=17/${b.latitude}/${b.longitude}`;
  }
  const endereco = [b.endereco, b.cidade].filter(Boolean).join(", ");
  return endereco ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(endereco)}` : null;
}

function mapaEmbutido(b: BuffetBusca) {
  if (b.latitude == null || b.longitude == null) return null;
  const caixa = [b.longitude - 0.006, b.latitude - 0.0035, b.longitude + 0.006, b.latitude + 0.0035].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${caixa}&layer=mapnik&marker=${b.latitude},${b.longitude}`;
}

function ErroPerfil({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Alerta tipo="erro" titulo="Não foi possível abrir o perfil deste buffet.">
        Verifique sua conexão com a internet e tente novamente em instantes.
      </Alerta>
      <div className="mt-6 flex flex-wrap gap-3">
        <BotaoLink href={`/buffet/${id}`} prefetch={false}>
          Tentar novamente
        </BotaoLink>
        <BotaoLink href="/" variante="secundario">
          Voltar para a busca
        </BotaoLink>
      </div>
    </div>
  );
}

// T5.0 Detalhes do Buffet (UC07)
export default async function PaginaBuffet({ params }: Props) {
  const { id } = await params;
  const [resultado, sessao] = await Promise.all([buscarPerfilBuffet(id), obterSessao()]);
  if (resultado.situacao === "nao-encontrado") notFound();
  if (resultado.situacao === "erro") return <ErroPerfil id={id} />;

  const { buffet, midias, pacotes, avaliacoes, indisponiveis } = resultado.perfil;
  const visitante: Visitante = { tipo: sessao?.tipo ?? null, dono: sessao?.id === buffet.id };
  const podePedir = visitante.tipo !== "buffet";
  const servicos = separarItens(buffet.servicos);
  const mapa = mapaEmbutido(buffet);
  const urlMapa = linkMapa(buffet);
  const local = [buffet.endereco, buffet.cidade].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-700">
        <ArrowLeft className="size-4" /> Voltar para a busca
      </Link>

      <header className="mb-6 mt-4">
        {buffet.tipos_evento.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {buffet.tipos_evento.map((t) => (
              <Selo key={t} cor="azul">
                {t}
              </Selo>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{buffet.nome_fantasia}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          {buffet.nota_media != null ? (
            <a href="#avaliacoes" className="inline-flex items-center gap-1.5 hover:text-brand-700">
              <Estrelas nota={buffet.nota_media} />
              <b className="text-slate-900">{formatarNota(buffet.nota_media)}</b>
              <span className="underline-offset-2 hover:underline">
                ({buffet.total_avaliacoes} {buffet.total_avaliacoes === 1 ? "avaliação" : "avaliações"})
              </span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent-500" /> Novo no BuffetHub
            </span>
          )}
          {local && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" /> {local}
            </span>
          )}
          {buffet.capacidade_maxima != null && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-slate-400" /> Até <b className="text-slate-900">{buffet.capacidade_maxima}</b> convidados
            </span>
          )}
          {buffet.estilo_culinaria && (
            <span className="inline-flex items-center gap-1.5">
              <ChefHat className="size-4 text-slate-400" /> Culinária <b className="text-slate-900">{buffet.estilo_culinaria.toLowerCase()}</b>
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="min-w-0 lg:col-start-1">
          <Galeria itens={midias} nome={buffet.nome_fantasia} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <CartaoReserva buffet={buffet} visitante={visitante} />
        </aside>

        <div className="min-w-0 space-y-6 lg:col-start-1">
          <nav aria-label="Seções do perfil" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {ATALHOS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
              >
                {a.rotulo}
              </a>
            ))}
          </nav>

          <Secao id="sobre" titulo="Sobre o buffet" Icone={Info}>
            {buffet.descricao ? (
              <p className="whitespace-pre-line leading-relaxed text-slate-700">{buffet.descricao}</p>
            ) : (
              <p className="text-sm text-slate-500">O buffet ainda não escreveu uma descrição.</p>
            )}
            {servicos.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Serviços oferecidos</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {servicos.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="size-3.5" />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Secao>

          <Secao
            id="cardapio"
            titulo="Pacotes do cardápio"
            subtitulo="Preços por pessoa. O valor final chega na proposta do buffet."
            Icone={UtensilsCrossed}
          >
            <ListaPacotes pacotes={pacotes} buffetId={buffet.id} podeEscolher={podePedir} />
          </Secao>

          <Secao id="disponibilidade" titulo="Datas livres" subtitulo="Agenda do buffet para os próximos meses." Icone={CalendarDays}>
            <div className="mx-auto max-w-md">
              <CalendarioDisponibilidade
                indisponiveis={indisponiveis}
                hoje={hojeISO()}
                linkOrcamento={podePedir ? `/buffet/${buffet.id}/orcamento` : null}
              />
            </div>
          </Secao>

          <Secao
            id="avaliacoes"
            titulo="Avaliações"
            subtitulo="Feitas por clientes que já realizaram eventos aqui."
            Icone={MessageSquareQuote}
          >
            <Avaliacoes avaliacoes={avaliacoes} media={buffet.nota_media} />
          </Secao>

          <Secao id="localizacao" titulo="Localização" Icone={MapPin}>
            {local ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{buffet.endereco ?? buffet.cidade}</p>
                    {buffet.endereco && buffet.cidade && <p className="text-sm text-slate-500">{buffet.cidade}</p>}
                  </div>
                  {urlMapa && (
                    <a
                      href={urlMapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver no mapa <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
                {mapa && (
                  <iframe
                    src={mapa}
                    title={`Mapa com a localização de ${buffet.nome_fantasia}`}
                    loading="lazy"
                    className="h-64 w-full rounded-2xl border border-slate-200 bg-slate-100 sm:h-72"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">O buffet ainda não informou o endereço.</p>
            )}
          </Secao>
        </div>
      </div>

      <BarraReservaMovel buffet={buffet} visitante={visitante} />
    </div>
  );
}

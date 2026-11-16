import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  BadgeCheck,
  CalendarHeart,
  ChefHat,
  Check,
  ConciergeBell,
  HandCoins,
  MapPin,
  Package,
  Plus,
  Scale,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Alerta, Foto, Selo, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { BotaoRemover, LinkVoltarBusca, SincronizarComparacao } from "@/components/busca/acoes-comparacao";
import { NotaBuffet, listaServicos, localizacao } from "@/components/busca/info-buffet";
import { MAX_COMPARAR, MIN_COMPARAR } from "@/components/busca/parametros";
import { moeda } from "@/lib/formatos";
import { buscarParaComparar, type BuffetComparado } from "@/models/busca";

/** UC06 E1: menos de 2 (ou mais de 4) buffets escolhidos. */
export function AvisoQuantidade({ texto }: { texto?: string }) {
  return (
    <Vazio
      Icone={Scale}
      titulo={`Selecione de ${MIN_COMPARAR} a ${MAX_COMPARAR} buffets para comparar.`}
      texto={
        texto ??
        "Na busca, use o botão “Comparar” nos cartões dos buffets que você quer ver lado a lado e depois clique em “Comparar” na barra que aparece embaixo da tela."
      }
      acao={
        <LinkVoltarBusca comoBotao="primario">
          <ArrowLeft className="size-4" /> Voltar à busca
        </LinkVoltarBusca>
      }
    />
  );
}

/**
 * Valor que ganha o selo de destaque (menor preço, melhor nota, maior capacidade).
 * Só existe destaque quando pelo menos dois buffets têm o dado e eles são diferentes.
 */
function destaque(valores: (number | null)[], criterio: "menor" | "maior") {
  const numeros = valores.filter((v): v is number => v != null).map(Number);
  if (numeros.length < 2) return null;
  const alvo = criterio === "menor" ? Math.min(...numeros) : Math.max(...numeros);
  return numeros.every((n) => n === alvo) ? null : alvo;
}

type Linha = { rotulo: string; Icone: LucideIcon; celula: (b: BuffetComparado) => React.ReactNode };

const CELULA_ROTULO =
  "sticky left-0 z-10 w-36 bg-slate-50 px-4 py-4 text-left align-top text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[inset_-1px_0_0_var(--color-slate-200)] sm:w-48";
const CELULA = "px-4 py-4 align-top text-sm text-slate-700";
const CELULA_VAGA = "bg-slate-50/40 px-4 py-4 text-center align-middle text-slate-300";

export async function TabelaComparacao({ ids }: { ids: string[] }) {
  const { dados: buffets, erro } = await buscarParaComparar(ids);
  if (erro) {
    return (
      <Alerta tipo="erro" titulo="Não foi possível montar a comparação">
        {erro}
      </Alerta>
    );
  }
  if (buffets.length < MIN_COMPARAR) {
    return <AvisoQuantidade texto="Alguns dos buffets escolhidos não foram encontrados. Volte à busca e marque outros." />;
  }

  const menorPreco = destaque(buffets.map((b) => b.preco_min), "menor");
  const melhorNota = destaque(
    buffets.map((b) => (b.total_avaliacoes > 0 ? b.nota_media : null)),
    "maior",
  );
  const maiorCapacidade = destaque(buffets.map((b) => b.capacidade_maxima), "maior");
  const temVaga = buffets.length < MAX_COMPARAR;
  const idsAtuais = buffets.map((b) => b.id);
  const colunas = buffets.length + (temVaga ? 1 : 0);

  const linhas: Linha[] = [
    {
      rotulo: "Preço por pessoa",
      Icone: HandCoins,
      celula: (b) => (
        <div className="space-y-1.5">
          {b.preco_min != null ? (
            <p>
              <span className="block text-xs text-slate-500">a partir de</span>
              <span className="text-xl font-extrabold tracking-tight text-brand-700">{moeda(b.preco_min)}</span>
              <span className="text-xs text-slate-500">/pessoa</span>
            </p>
          ) : (
            <p className="text-slate-500">Sob consulta</p>
          )}
          {menorPreco != null && Number(b.preco_min) === menorPreco && (
            <Selo cor="verde">
              <BadgeCheck className="size-3.5" /> Menor preço
            </Selo>
          )}
        </div>
      ),
    },
    {
      rotulo: "Avaliação",
      Icone: Star,
      celula: (b) => (
        <div className="space-y-1.5">
          <NotaBuffet nota={b.nota_media} total={b.total_avaliacoes} />
          {melhorNota != null && b.total_avaliacoes > 0 && Number(b.nota_media) === melhorNota && (
            <Selo cor="amarelo">
              <Trophy className="size-3.5" /> Melhor avaliado
            </Selo>
          )}
        </div>
      ),
    },
    {
      rotulo: "Capacidade",
      Icone: Users,
      celula: (b) => (
        <div className="space-y-1.5">
          {b.capacidade_maxima != null ? (
            <p>
              até <strong className="text-base font-bold text-slate-900">{b.capacidade_maxima}</strong> convidados
            </p>
          ) : (
            <p className="text-slate-500">Não informada</p>
          )}
          {maiorCapacidade != null && b.capacidade_maxima === maiorCapacidade && (
            <Selo cor="azul">
              <Users className="size-3.5" /> Maior capacidade
            </Selo>
          )}
        </div>
      ),
    },
    {
      rotulo: "Estilo de culinária",
      Icone: ChefHat,
      celula: (b) => <span className="font-medium text-slate-800">{b.estilo_culinaria ?? "Não informado"}</span>,
    },
    {
      rotulo: "Tipos de evento",
      Icone: CalendarHeart,
      celula: (b) =>
        b.tipos_evento.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {b.tipos_evento.map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Não informado</span>
        ),
    },
    {
      rotulo: "Serviços",
      Icone: ConciergeBell,
      celula: (b) => {
        const servicos = listaServicos(b.servicos);
        return servicos.length ? (
          <ul className="space-y-1.5">
            {servicos.map((s) => (
              <li key={s} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Não informado</span>
        );
      },
    },
    {
      rotulo: "Pacotes",
      Icone: Package,
      celula: (b) =>
        b.pacotes.length ? (
          <ul className="space-y-2">
            {b.pacotes.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">{p.nome}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  <strong className="text-sm font-bold text-slate-900">{moeda(p.preco_por_pessoa)}</strong>/pessoa
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Nenhum pacote ativo</span>
        ),
    },
  ];

  return (
    <>
      <SincronizarComparacao
        itens={buffets.map((b) => ({ id: b.id, nome: b.nome_fantasia, capa_url: b.capa_url }))}
      />
      <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 sm:hidden">
        <ArrowLeftRight className="size-4" /> Deslize a tabela para o lado para ver todos os buffets.
      </p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full table-fixed border-collapse" style={{ minWidth: 150 + colunas * 220 }}>
            <caption className="sr-only">Comparação lado a lado de {buffets.length} buffets</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className={`${CELULA_ROTULO} align-bottom`}>
                  <span className="flex items-center gap-2">
                    <Scale className="size-4" /> {buffets.length} buffets
                  </span>
                </th>
                {buffets.map((b) => (
                  <th key={b.id} scope="col" className="px-4 pb-4 pt-5 text-left align-top font-normal">
                    <div className="group">
                      <Link
                        href={`/buffet/${b.id}`}
                        className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                        tabIndex={-1}
                        aria-hidden
                      >
                        <Foto
                          src={b.capa_url}
                          alt=""
                          className="absolute inset-0 size-full transition duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <Link
                        href={`/buffet/${b.id}`}
                        className="mt-3 block text-base font-bold leading-snug text-slate-900 transition hover:text-brand-700"
                      >
                        {b.nome_fantasia}
                      </Link>
                      <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                        <MapPin className="mt-px size-3.5 shrink-0" />
                        {localizacao(b.endereco, b.cidade)}
                      </p>
                    </div>
                    <div className="-ml-2 mt-2">
                      <BotaoRemover id={b.id} nome={b.nome_fantasia} ids={idsAtuais} />
                    </div>
                  </th>
                ))}
                {temVaga && (
                  <th scope="col" className="px-4 pb-4 pt-5 align-top font-normal">
                    <LinkVoltarBusca className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 transition hover:border-brand-400 hover:bg-brand-50/60 hover:text-brand-700">
                      <span className="grid size-10 place-items-center rounded-full bg-white shadow-soft">
                        <Plus className="size-5" />
                      </span>
                      Adicionar buffet
                    </LinkVoltarBusca>
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Você pode comparar até {MAX_COMPARAR} buffets.
                    </p>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map(({ rotulo, Icone, celula }) => (
                <tr key={rotulo}>
                  <th scope="row" className={CELULA_ROTULO}>
                    <span className="flex items-center gap-2">
                      <Icone className="size-4 shrink-0 text-brand-500" /> {rotulo}
                    </span>
                  </th>
                  {buffets.map((b) => (
                    <td key={b.id} className={CELULA}>
                      {celula(b)}
                    </td>
                  ))}
                  {temVaga && <td className={CELULA_VAGA}>—</td>}
                </tr>
              ))}
              <tr>
                <th scope="row" className={CELULA_ROTULO}>
                  <span className="sr-only">Ações</span>
                </th>
                {buffets.map((b) => (
                  <td key={b.id} className={CELULA}>
                    <div className="flex flex-col gap-2">
                      <BotaoLink href={`/buffet/${b.id}/orcamento`} tamanho="sm" className="h-9 w-full">
                        Solicitar orçamento
                      </BotaoLink>
                      <BotaoLink href={`/buffet/${b.id}`} variante="secundario" tamanho="sm" className="h-9 w-full">
                        Ver perfil
                      </BotaoLink>
                    </div>
                  </td>
                ))}
                {temVaga && <td className={CELULA_VAGA} />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

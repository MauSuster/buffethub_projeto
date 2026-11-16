import Link from "next/link";
import { criarClientePublico } from "@/lib/supabase/server";
import { moeda } from "@/lib/formatos";

const TIPOS = ["Casamento", "Aniversário", "15 anos", "Infantil", "Corporativo", "Formatura"];
const ESTILOS = ["Brasileira", "Contemporânea", "Italiana", "Japonesa", "Churrasco"];

type Busca = { q?: string; cidade?: string; tipo?: string; convidados?: string; preco?: string; estilo?: string };

export default async function Home(props: { searchParams: Promise<Busca> }) {
  const f = await props.searchParams;
  let consulta = criarClientePublico()
    .from("vw_buffet_busca")
    .select("*")
    .order("nota_media", { ascending: false, nullsFirst: false });
  if (f.q) consulta = consulta.or(`nome_fantasia.ilike.%${f.q}%,descricao.ilike.%${f.q}%`);
  if (f.cidade) consulta = consulta.ilike("cidade", `%${f.cidade}%`);
  if (f.tipo) consulta = consulta.contains("tipos_evento", [f.tipo]);
  if (f.convidados) consulta = consulta.gte("capacidade_maxima", Number(f.convidados));
  if (f.preco) consulta = consulta.lte("preco_min", Number(f.preco));
  if (f.estilo) consulta = consulta.eq("estilo_culinaria", f.estilo);
  const { data: buffets, error } = await consulta;

  const campo = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <form className="h-fit space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-[#2f5d8a]">Filtros</h2>
        <input name="q" defaultValue={f.q} placeholder="Nome ou palavra-chave" className={campo} />
        <input name="cidade" defaultValue={f.cidade} placeholder="Cidade" className={campo} />
        <select name="tipo" defaultValue={f.tipo ?? ""} className={campo}>
          <option value="">Tipo de evento</option>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input name="convidados" type="number" min={1} defaultValue={f.convidados} placeholder="Nº de convidados" className={campo} />
        <input name="preco" type="number" min={1} defaultValue={f.preco} placeholder="Preço máx. por pessoa (R$)" className={campo} />
        <select name="estilo" defaultValue={f.estilo ?? ""} className={campo}>
          <option value="">Estilo de culinária</option>
          {ESTILOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button className="w-full rounded-md bg-[#2f5d8a] py-2 text-sm font-semibold text-white hover:bg-[#244a6e]">Buscar</button>
        <Link href="/" className="block text-center text-xs text-slate-500 hover:underline">Limpar filtros</Link>
      </form>

      <section>
        <h1 className="mb-4 text-2xl font-bold">Encontre o buffet ideal para o seu evento</h1>
        {error && <p className="text-red-600">Erro ao buscar: {error.message}</p>}
        {buffets?.length === 0 && <p className="text-slate-600">Nenhum buffet encontrado. Tente mudar os filtros.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buffets?.map((b) => (
            <Link key={b.id} href={`/buffet/${b.id}`} className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.capa_url ?? "/demo/salao-1.svg"} alt={b.nome_fantasia} className="h-36 w-full object-cover" />
              <div className="space-y-1 p-3">
                <h3 className="font-semibold">{b.nome_fantasia}</h3>
                <p className="text-sm text-slate-600">
                  {b.cidade} · até {b.capacidade_maxima} convidados
                </p>
                <p className="text-sm">{b.estilo_culinaria}</p>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="font-semibold text-[#2f5d8a]">a partir de {moeda(b.preco_min)}/pessoa</span>
                  <span>{b.nota_media ? `★ ${b.nota_media} (${b.total_avaliacoes})` : "Sem avaliações"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

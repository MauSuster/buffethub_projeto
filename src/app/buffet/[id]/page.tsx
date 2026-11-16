import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClientePublico } from "@/lib/supabase/server";
import { data as dataBR, moeda } from "@/lib/formatos";

export default async function DetalhesBuffet(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const sb = criarClientePublico();
  const hoje = new Date().toISOString().slice(0, 10);
  const [{ data: b }, { data: fotos }, { data: pacotes }, { data: avaliacoes }, { data: datas }] = await Promise.all([
    sb.from("vw_buffet_busca").select("*").eq("id", id).maybeSingle(),
    sb.from("midia_portfolio").select("*").eq("buffet_id", id).order("criada_em"),
    sb.from("pacote").select("*").eq("buffet_id", id).eq("ativo", true).order("preco_por_pessoa"),
    sb.from("avaliacao").select("*").eq("buffet_id", id).order("data", { ascending: false }),
    sb.from("disponibilidade").select("data,status").eq("buffet_id", id).gte("data", hoje).order("data").limit(10),
  ]);
  if (!b) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[#2f5d8a] hover:underline">
        ← Voltar para a busca
      </Link>
      <div className="grid gap-2 sm:grid-cols-3">
        {fotos?.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f.id} src={f.url} alt={f.descricao ?? ""} className="h-44 w-full rounded-lg object-cover" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold">{b.nome_fantasia}</h1>
            <p className="text-sm text-slate-600">
              {b.endereco} · {b.cidade}
            </p>
            <p className="mt-3">{b.descricao}</p>
            <p className="mt-3 text-sm">
              <b>Eventos:</b> {b.tipos_evento?.join(", ")}
            </p>
            <p className="text-sm">
              <b>Serviços:</b> {b.servicos}
            </p>
            <p className="text-sm">
              <b>Capacidade:</b> até {b.capacidade_maxima} convidados · <b>Culinária:</b> {b.estilo_culinaria}
            </p>
          </section>
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-[#2f5d8a]">Cardápio e preços</h2>
            <div className="space-y-3">
              {pacotes?.map((p) => (
                <div key={p.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex justify-between font-semibold">
                    <span>{p.nome}</span>
                    <span>{moeda(p.preco_por_pessoa)}/pessoa</span>
                  </div>
                  <p className="text-sm text-slate-600">{p.itens_cardapio}</p>
                  {p.servicos_adicionais && <p className="text-xs text-slate-500">Adicionais: {p.servicos_adicionais}</p>}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-[#2f5d8a]">
              Avaliações {b.nota_media ? `· ★ ${b.nota_media} (${b.total_avaliacoes})` : ""}
            </h2>
            {avaliacoes?.length === 0 && <p className="text-sm text-slate-600">Este buffet ainda não tem avaliações.</p>}
            {avaliacoes?.map((a) => (
              <div key={a.id} className="border-b border-slate-100 py-2 last:border-0">
                <p className="text-sm font-semibold">
                  {"★".repeat(a.nota)}
                  {"☆".repeat(5 - a.nota)} · {a.autor_nome}
                </p>
                <p className="text-sm text-slate-700">{a.comentario}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">A partir de</p>
          <p className="text-2xl font-bold text-[#2f5d8a]">
            {moeda(b.preco_min)}
            <span className="text-sm font-normal">/pessoa</span>
          </p>
          <div>
            <h3 className="text-sm font-semibold">Datas indisponíveis</h3>
            {datas?.length ? (
              <ul className="text-sm text-slate-600">
                {datas.map((d) => (
                  <li key={d.data}>
                    {dataBR(d.data)} – {d.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Todas as próximas datas estão livres.</p>
            )}
          </div>
          <button
            disabled
            className="w-full cursor-not-allowed rounded-md bg-[#e8a33d] py-2 font-semibold text-white opacity-70"
            title="Em desenvolvimento: login e pedido de orçamento"
          >
            Solicitar orçamento (em breve)
          </button>
        </aside>
      </div>
    </div>
  );
}

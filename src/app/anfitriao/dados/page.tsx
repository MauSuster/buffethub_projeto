import { Suspense } from "react";
import { ExternalLink, MessageSquareQuote, Store } from "lucide-react";
import { exigirBuffet } from "@/lib/auth";
import { data as dataBR } from "@/lib/formatos";
import { Alerta, Cartao, Estrelas, TituloPagina, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { ErroCarregamento, EsqueletoFormulario } from "@/components/anfitriao/estados";
import { FormDadosBuffet } from "@/components/anfitriao/form-dados";
import { Portfolio } from "@/components/anfitriao/portfolio";
import * as modelo from "@/models/anfitriao";

export const metadata = { title: "Dados do buffet" };

// T8.1 Dados do Buffet (UC17)
export default async function DadosBuffet() {
  const sessao = await exigirBuffet("/anfitriao/dados");
  return (
    <>
      <TituloPagina
        titulo="Dados do buffet"
        subtitulo="Essas informações aparecem no seu perfil público e na busca de buffets."
        acoes={
          <BotaoLink href={`/buffet/${sessao.id}`} target="_blank" variante="secundario">
            <ExternalLink className="size-4" /> Ver perfil público
          </BotaoLink>
        }
      />
      <Suspense fallback={<EsqueletoFormulario />}>
        <Conteudo buffetId={sessao.id} />
      </Suspense>
    </>
  );
}

async function Conteudo({ buffetId }: { buffetId: string }) {
  const [perfil, fotos, resumo, avaliacoes] = await Promise.all([
    modelo.obterPerfilBuffet(buffetId),
    modelo.listarFotos(buffetId),
    modelo.obterResumoAvaliacoes(buffetId),
    modelo.listarAvaliacoes(buffetId),
  ]);
  const erro = perfil.erro ?? fotos.erro ?? resumo.erro ?? avaliacoes.erro;
  if (erro) return <ErroCarregamento mensagem={erro} />;
  if (!perfil.dados) {
    return <Vazio Icone={Store} titulo="Buffet não encontrado" texto="Não encontramos o cadastro do seu buffet. Entre novamente." />;
  }
  const { buffet, email, telefone } = perfil.dados;
  const primeiroCadastro = !buffet.descricao && !buffet.endereco && !buffet.capacidade_maxima;

  return (
    <div className="space-y-6">
      {primeiroCadastro && (
        <Alerta tipo="info" titulo="Bem-vindo ao BuffetHub!">
          Preencha os dados abaixo para o seu buffet aparecer na busca. Depois, cadastre seus pacotes em Cardápio e preços.
        </Alerta>
      )}
      <FormDadosBuffet buffet={buffet} email={email} telefone={telefone} />
      <Portfolio buffetId={buffetId} fotos={fotos.dados} />

      <Cartao className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600">
              <MessageSquareQuote className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Avaliações recentes</h2>
              <p className="text-sm text-slate-500">O que os clientes disseram depois dos eventos.</p>
            </div>
          </div>
          {resumo.dados.notaMedia != null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{resumo.dados.notaMedia.toFixed(1).replace(".", ",")}</span>
              <div>
                <Estrelas nota={resumo.dados.notaMedia} />
                <p className="text-xs text-slate-500">
                  {resumo.dados.total} {resumo.dados.total === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            </div>
          )}
        </div>
        {avaliacoes.dados.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Você ainda não recebeu avaliações. Elas aparecem aqui depois que os clientes realizam o evento.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {avaliacoes.dados.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Estrelas nota={a.nota} />
                    <span className="text-sm font-semibold text-slate-800">{a.autor_nome ?? "Cliente"}</span>
                  </div>
                  <span className="text-xs text-slate-400">{dataBR(a.data)}</span>
                </div>
                {a.comentario && <p className="mt-1.5 text-sm text-slate-600">{a.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}

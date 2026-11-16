import { Suspense } from "react";
import type { Sessao } from "@/lib/auth";
import { Alerta, TituloPagina } from "@/components/ui/basicos";
import { CentralMensagens } from "@/components/mensagens/central-mensagens";
import { EsqueletoMensagens } from "@/components/mensagens/esqueleto";
import { idValido, type Contato } from "@/components/mensagens/tipos";
import { buscarContato, listarConversas, listarMensagens } from "@/models/mensagens";
import type { Conversa, Mensagem } from "@/lib/database.types";

type PropsPagina = { sessao: Sessao; com?: string };

async function ConteudoMensagens({ sessao, com, base }: PropsPagina & { base: string }) {
  const idAberto = idValido(com) && com !== sessao.id ? com : null;

  let conversas: Conversa[] = [];
  let mensagens: Mensagem[] = [];
  let contato: Contato | null = null;
  let erroCarga: string | null = null;
  try {
    [conversas, contato, mensagens] = await Promise.all([
      listarConversas(),
      idAberto ? buscarContato(idAberto) : Promise.resolve(null),
      idAberto ? listarMensagens(sessao.id, idAberto) : Promise.resolve([]),
    ]);
  } catch (e) {
    erroCarga = e instanceof Error ? e.message : "Não foi possível carregar suas mensagens.";
  }

  if (erroCarga) {
    return (
      <Alerta tipo="erro" titulo="Não foi possível carregar suas mensagens">
        {erroCarga} Atualize a página para tentar de novo.
      </Alerta>
    );
  }

  let erroContato: string | null = null;
  if (com && !idAberto) {
    erroContato = "O endereço desta conversa é inválido.";
  } else if (idAberto && !contato) {
    erroContato = "Não encontramos este usuário ou você não tem acesso a esta conversa.";
  } else if (contato && contato.tipo === sessao.tipo) {
    erroContato =
      sessao.tipo === "buffet" ? "Pelo BuffetHub, buffets conversam apenas com clientes." : "Pelo BuffetHub, clientes conversam apenas com buffets.";
    contato = null;
  }

  return (
    <CentralMensagens
      meuId={sessao.id}
      meuTipo={sessao.tipo}
      base={base}
      conversasIniciais={conversas}
      mensagensIniciais={contato ? mensagens : []}
      idAberto={com ? (idAberto ?? com) : null}
      contato={contato}
      erroContato={erroContato}
    />
  );
}

/** T7.4 / T8.5 Mensagens (UC03): mesma tela para cliente e anfitrião. */
export function PaginaMensagens({ sessao, com }: PropsPagina) {
  const base = sessao.tipo === "buffet" ? "/anfitriao/mensagens" : "/cliente/mensagens";
  return (
    <>
      <div className={com ? "max-md:hidden" : undefined}>
        <TituloPagina
          titulo="Mensagens"
          subtitulo={
            sessao.tipo === "buffet"
              ? "Converse com os clientes que pediram orçamento ao seu buffet."
              : "Converse com os buffets e combine os detalhes do seu evento."
          }
        />
      </div>
      <Suspense fallback={<EsqueletoMensagens aberta={Boolean(com)} />}>
        <ConteudoMensagens sessao={sessao} com={com} base={base} />
      </Suspense>
    </>
  );
}

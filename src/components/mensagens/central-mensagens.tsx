"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { ArrowLeft, MessageSquareOff, MessagesSquare, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { enviarMensagem, marcarConversaLida } from "@/controllers/mensagens";
import { BotaoLink } from "@/components/ui/botao";
import { Vazio } from "@/components/ui/basicos";
import { Conversa } from "@/components/mensagens/conversa";
import { ListaConversas } from "@/components/mensagens/lista-conversas";
import { classesCaixa } from "@/components/mensagens/esqueleto";
import type { Contato, ItemMensagem, ResultadoEnvio } from "@/components/mensagens/tipos";
import type { Conversa as ResumoConversa, Mensagem, TipoUsuario } from "@/lib/database.types";

type Props = {
  meuId: string;
  meuTipo: TipoUsuario;
  base: string;
  conversasIniciais: ResumoConversa[];
  mensagensIniciais: Mensagem[];
  idAberto: string | null;
  contato: Contato | null;
  erroContato: string | null;
};

/** Junta o que veio do servidor com o que só existe na tela (envios pendentes e mensagens chegadas depois). */
function mesclar(servidor: Mensagem[], locais: ItemMensagem[]): ItemMensagem[] {
  const ids = new Set(servidor.map((m) => m.id));
  const extras = locais.filter((m) => !ids.has(m.id));
  if (extras.length === 0) return servidor;
  return [...servidor, ...extras].sort((a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime());
}

/** Coloca a conversa no topo da lista com a última mensagem. */
function registrarNaLista(
  lista: ResumoConversa[],
  pessoa: Pick<ResumoConversa, "outro_id" | "outro_nome" | "outro_tipo">,
  texto: string,
  quando: string,
  somarNaoLida: boolean,
): ResumoConversa[] {
  const atual = lista.find((c) => c.outro_id === pessoa.outro_id);
  const item: ResumoConversa = {
    ...pessoa,
    ...atual,
    ultima_mensagem: texto,
    ultima_data: quando,
    nao_lidas: (atual?.nao_lidas ?? 0) + (somarNaoLida ? 1 : 0),
  };
  return [item, ...lista.filter((c) => c.outro_id !== pessoa.outro_id)];
}

function NenhumaSelecionada({ meuTipo, temConversas }: { meuTipo: TipoUsuario; temConversas: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-slate-50/80 to-white px-8 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/60">
        <MessagesSquare className="size-7" />
      </div>
      <p className="mt-5 text-lg font-semibold text-slate-900">Suas mensagens</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {temConversas
          ? "Escolha uma conversa ao lado para ver o histórico e responder."
          : meuTipo === "cliente"
            ? "Abra o perfil de um buffet e clique em “Enviar mensagem” para começar uma conversa."
            : "Quando um cliente escrever para o seu buffet, a conversa aparece aqui."}
      </p>
      {meuTipo === "cliente" && !temConversas && (
        <BotaoLink href="/" className="mt-5">
          <Search className="size-4" /> Buscar buffets
        </BotaoLink>
      )}
    </div>
  );
}

function ConversaIndisponivel({ base, erro }: { base: string; erro: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-3 md:hidden">
        <Link href={base} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" /> Conversas
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Vazio
          Icone={MessageSquareOff}
          titulo="Conversa indisponível"
          texto={erro}
          acao={
            <BotaoLink href={base} variante="secundario">
              Ver minhas conversas
            </BotaoLink>
          }
        />
      </div>
    </div>
  );
}

/** UC03: lista de conversas + conversa aberta, com envio otimista e mensagens em tempo real. */
export function CentralMensagens({
  meuId,
  meuTipo,
  base,
  conversasIniciais,
  mensagensIniciais,
  idAberto,
  contato,
  erroContato,
}: Props) {
  const router = useRouter();
  const [conversas, setConversas] = useState(conversasIniciais);
  const [mensagens, setMensagens] = useState<ItemMensagem[]>(mensagensIniciais);
  const [origem, setOrigem] = useState({ conversas: conversasIniciais, mensagens: mensagensIniciais, idAberto });

  if (origem.conversas !== conversasIniciais || origem.mensagens !== mensagensIniciais || origem.idAberto !== idAberto) {
    setOrigem({ conversas: conversasIniciais, mensagens: mensagensIniciais, idAberto });
    setConversas(conversasIniciais);
    setMensagens(origem.idAberto === idAberto ? mesclar(mensagensIniciais, mensagens) : mensagensIniciais);
  }

  const aoReceber = useEffectEvent((nova: Mensagem) => {
    const daConversaAberta = nova.remetente_id === idAberto && contato !== null;
    if (daConversaAberta) {
      setMensagens((lista) => (lista.some((m) => m.id === nova.id) ? lista : [...lista, { ...nova, lida: true }]));
      void marcarConversaLida(nova.remetente_id);
    }
    const conhecida = conversas.find((c) => c.outro_id === nova.remetente_id);
    if (!conhecida && !daConversaAberta) {
      router.refresh();
      return;
    }
    const pessoa = conhecida ?? { outro_id: contato!.id, outro_nome: contato!.nome, outro_tipo: contato!.tipo };
    setConversas((lista) => registrarNaLista(lista, pessoa, nova.conteudo, nova.data_envio, !daConversaAberta));
  });

  const aoReconectar = useEffectEvent(() => router.refresh());

  useEffect(() => {
    const supabase = criarClienteNavegador();
    let jaConectou = false;
    const canal = supabase
      .channel(`mensagens-${meuId}-${Math.random().toString(36).slice(2)}`)
      .on<Mensagem>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagem", filter: `destinatario_id=eq.${meuId}` },
        (payload) => aoReceber(payload.new),
      )
      .on<Mensagem>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mensagem", filter: `remetente_id=eq.${meuId}` },
        (payload) => {
          const alterada = payload.new;
          setMensagens((lista) => lista.map((m) => (m.id === alterada.id ? { ...m, lida: alterada.lida } : m)));
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (jaConectou) aoReconectar();
        jaConectou = true;
      });
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [meuId]);

  const podeLer = idAberto !== null && contato !== null;
  useEffect(() => {
    if (podeLer && idAberto) void marcarConversaLida(idAberto);
  }, [podeLer, idAberto]);

  async function enviar(texto: string) {
    if (!contato) return;
    const provisoria: ItemMensagem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      remetente_id: meuId,
      destinatario_id: contato.id,
      conteudo: texto,
      data_envio: new Date().toISOString(),
      lida: false,
      estado: "enviando",
    };
    setMensagens((lista) => [...lista, provisoria]);
    setConversas((lista) =>
      registrarNaLista(
        lista,
        { outro_id: contato.id, outro_nome: contato.nome, outro_tipo: contato.tipo },
        texto,
        provisoria.data_envio,
        false,
      ),
    );

    let resultado: ResultadoEnvio;
    try {
      resultado = await enviarMensagem(contato.id, texto);
    } catch {
      resultado = { ok: false, erro: "Verifique sua conexão com a internet e tente de novo." };
    }

    if (resultado.ok) {
      const gravada = resultado.mensagem;
      setMensagens((lista) =>
        lista.some((m) => m.id === gravada.id)
          ? lista.filter((m) => m.id !== provisoria.id)
          : lista.map((m) => (m.id === provisoria.id ? gravada : m)),
      );
    } else {
      const erro = resultado.erro;
      setMensagens((lista) => lista.map((m) => (m.id === provisoria.id ? { ...m, estado: "erro", erro } : m)));
    }
  }

  function tentarDeNovo(id: string) {
    const falhou = mensagens.find((m) => m.id === id);
    if (!falhou) return;
    setMensagens((lista) => lista.filter((m) => m.id !== id));
    void enviar(falhou.conteudo);
  }

  function descartar(id: string) {
    setMensagens((lista) => lista.filter((m) => m.id !== id));
  }

  const aberta = idAberto !== null;
  const novaConversa = contato && !conversas.some((c) => c.outro_id === contato.id) ? contato : null;

  return (
    <div className={classesCaixa(aberta)}>
      <ListaConversas
        conversas={conversas}
        idAberto={idAberto}
        novaConversa={novaConversa}
        base={base}
        meuTipo={meuTipo}
        className={cn(aberta && "max-md:hidden")}
      />
      <section className={cn("min-h-0 min-w-0", !aberta && "max-md:hidden")}>
        {!aberta ? (
          <NenhumaSelecionada meuTipo={meuTipo} temConversas={conversas.length > 0} />
        ) : contato ? (
          <Conversa
            key={contato.id}
            contato={contato}
            meuId={meuId}
            meuTipo={meuTipo}
            base={base}
            mensagens={mensagens}
            onEnviar={(texto) => void enviar(texto)}
            onTentarDeNovo={tentarDeNovo}
            onDescartar={descartar}
          />
        ) : (
          <ConversaIndisponivel base={base} erro={erroContato ?? "Não foi possível abrir esta conversa."} />
        )}
      </section>
    </div>
  );
}

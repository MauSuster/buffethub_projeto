"use client";

import { useActionState, useState } from "react";
import { ChefHat, MapPin, PartyPopper, Save, Wallet } from "lucide-react";
import { salvarPerfil } from "@/controllers/conta";
import { estadoInicial, type EstadoAcao } from "@/lib/acoes";
import { mascaraTelefone } from "@/lib/formatos";
import { MensagemAcao } from "@/components/ui/basicos";
import { Botao, BotaoEnviar } from "@/components/ui/botao";
import { AreaTexto, Entrada } from "@/components/ui/campos";
import { useErrosCampos } from "@/components/conta/use-erros";

export type DadosPerfil = {
  nome: string;
  email: string;
  telefone: string;
  cpfOculto: string;
  preferencias: string;
};

const DICAS_PREFERENCIAS = [
  { Icone: PartyPopper, texto: "Tipo de evento" },
  { Icone: MapPin, texto: "Região" },
  { Icone: Wallet, texto: "Faixa de preço" },
  { Icone: ChefHat, texto: "Estilo de culinária" },
];

/** T7.5 Meu perfil (UC16): nome, telefone e preferências editáveis; e-mail e CPF só leitura. */
export function FormPerfil({ salvos }: { salvos: DadosPerfil }) {
  const [estado, acao] = useActionState(salvarPerfil, estadoInicial);
  const [cancelamento, setCancelamento] = useState<{ vez: number; estado: EstadoAcao }>({ vez: 0, estado: estadoInicial });
  const { erro, limpar } = useErrosCampos(estado);

  // UC16 A1: "Cancelar" descarta o que foi digitado e volta aos dados salvos.
  const descartado = cancelamento.vez > 0 && cancelamento.estado === estado;
  const v = descartado || estado.ok || !estado.valores ? salvos : { ...salvos, ...estado.valores };
  const erroCampo = (nome: string) => (descartado ? undefined : erro(nome));

  return (
    <form key={cancelamento.vez} action={acao} onChange={limpar} noValidate className="space-y-5">
      {!descartado && <MensagemAcao estado={estado} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Entrada
          name="nome"
          rotulo="Nome completo"
          autoComplete="name"
          defaultValue={v.nome}
          erro={erroCampo("nome")}
          required
          maxLength={120}
          classeContainer="sm:col-span-2"
          dica="Use o nome do seu documento: ele é conferido quando você assina um contrato."
        />
        <Entrada
          id="perfil-email"
          type="email"
          rotulo="E-mail"
          value={salvos.email}
          disabled
          readOnly
          dica="Usado para entrar na conta. Não pode ser alterado."
        />
        <Entrada
          name="telefone"
          type="tel"
          rotulo="Telefone"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(11) 98888-0000"
          defaultValue={v.telefone}
          erro={erroCampo("telefone")}
          required
          onChange={(e) => {
            e.currentTarget.value = mascaraTelefone(e.currentTarget.value);
          }}
        />
        <Entrada
          id="perfil-cpf"
          rotulo="CPF"
          value={salvos.cpfOculto}
          disabled
          readOnly
          dica="Por segurança, o CPF aparece parcialmente e não pode ser alterado."
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-slate-800">Preferências para o seu evento</p>
          <p className="mt-0.5 text-xs text-slate-500">Conte o que você procura. Isso ajuda a lembrar o que pedir nos orçamentos.</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {DICAS_PREFERENCIAS.map(({ Icone, texto }) => (
            <li key={texto} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              <Icone className="size-3.5 text-brand-500" />
              {texto}
            </li>
          ))}
        </ul>
        <AreaTexto
          name="preferencias"
          aria-label="Preferências"
          defaultValue={v.preferencias}
          erro={erroCampo("preferencias")}
          maxLength={500}
          rows={4}
          placeholder="Ex.: casamento para 150 convidados na zona sul de São Paulo, até R$ 150 por pessoa, culinária brasileira."
          dica="Opcional · até 500 caracteres."
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Botao type="button" variante="secundario" onClick={() => setCancelamento((c) => ({ vez: c.vez + 1, estado }))}>
          Cancelar
        </Botao>
        <BotaoEnviar textoEnviando="Salvando…">
          <Save className="size-4" />
          Salvar alterações
        </BotaoEnviar>
      </div>
    </form>
  );
}

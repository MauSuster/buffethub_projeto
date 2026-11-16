"use client";

import { useActionState } from "react";
import { Building2, MapPinned, Phone, Save, UsersRound, type LucideIcon } from "lucide-react";
import { estadoInicial } from "@/lib/acoes";
import { mascaraCnpj, mascaraTelefone } from "@/lib/formatos";
import type { Buffet } from "@/lib/database.types";
import { salvarDadosBuffet } from "@/controllers/anfitriao";
import { AreaTexto, Entrada } from "@/components/ui/campos";
import { BotaoEnviar } from "@/components/ui/botao";
import { Cartao, MensagemAcao } from "@/components/ui/basicos";
import { ESTILOS_CULINARIA, TIPOS_EVENTO } from "./constantes";
import { SeletorLocalizacao } from "./seletor-localizacao";

function Secao({ Icone, titulo, descricao, children }: {
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <Cartao className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icone className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{titulo}</h2>
          <p className="text-sm text-slate-500">{descricao}</p>
        </div>
      </div>
      {children}
    </Cartao>
  );
}

/** T8.1 / UC17: formulário dos dados do buffet. */
export function FormDadosBuffet({ buffet, email, telefone }: { buffet: Buffet; email: string; telefone: string | null }) {
  const [estado, acao] = useActionState(salvarDadosBuffet, estadoInicial);
  const erros = estado.erros ?? {};
  const valor = (nome: string, atual: string | number | null | undefined) =>
    estado.valores?.[nome] ?? (atual == null ? "" : String(atual));
  const tiposMarcados = estado.valores
    ? (estado.valores.tipos_evento ?? "").split("|").filter(Boolean)
    : buffet.tipos_evento;

  return (
    <form action={acao} className="space-y-6" noValidate>
      <Secao Icone={Building2} titulo="Informações gerais" descricao="Como o seu buffet se apresenta para os clientes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Entrada
            rotulo="Nome fantasia"
            name="nome_fantasia"
            required
            maxLength={100}
            defaultValue={valor("nome_fantasia", buffet.nome_fantasia)}
            erro={erros.nome_fantasia}
          />
          <Entrada
            rotulo="Estilo de culinária"
            name="estilo_culinaria"
            list="estilos-culinaria"
            placeholder="Ex.: Brasileira"
            defaultValue={valor("estilo_culinaria", buffet.estilo_culinaria)}
            erro={erros.estilo_culinaria}
          />
          <datalist id="estilos-culinaria">
            {ESTILOS_CULINARIA.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <AreaTexto
            rotulo="Descrição"
            name="descricao"
            required
            rows={5}
            maxLength={2000}
            classeContainer="sm:col-span-2"
            placeholder="Conte sobre o espaço, a experiência da equipe e o que torna seus eventos especiais."
            defaultValue={valor("descricao", buffet.descricao)}
            erro={erros.descricao}
          />
        </div>
      </Secao>

      <Secao Icone={UsersRound} titulo="Capacidade, eventos e serviços" descricao="Ajuda o cliente a saber se o buffet atende o evento dele.">
        <div className="grid gap-5">
          <Entrada
            rotulo="Capacidade máxima de convidados"
            name="capacidade_maxima"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            classeContainer="sm:max-w-xs"
            defaultValue={valor("capacidade_maxima", buffet.capacidade_maxima)}
            erro={erros.capacidade_maxima}
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              Tipos de evento atendidos<span className="text-red-500"> *</span>
            </legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {TIPOS_EVENTO.map((tipo) => (
                <label key={tipo} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="tipos_evento"
                    value={tipo}
                    defaultChecked={tiposMarcados.includes(tipo)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100">
                    {tipo}
                  </span>
                </label>
              ))}
            </div>
            {erros.tipos_evento && <p className="text-xs font-medium text-red-600">{erros.tipos_evento}</p>}
          </fieldset>
          <AreaTexto
            rotulo="Serviços oferecidos"
            name="servicos"
            rows={3}
            placeholder="Ex.: Decoração, DJ, garçons, bolo e doces, recepcionista"
            dica="Separe os serviços por vírgula."
            defaultValue={valor("servicos", buffet.servicos)}
            erro={erros.servicos}
          />
        </div>
      </Secao>

      <Secao Icone={Phone} titulo="Contato" descricao="Dados usados pelos clientes e pela plataforma para falar com você.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Entrada
            rotulo="Telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            defaultValue={valor("telefone", telefone)}
            onChange={(e) => {
              e.currentTarget.value = mascaraTelefone(e.currentTarget.value);
            }}
            erro={erros.telefone}
          />
          <Entrada rotulo="E-mail de contato" name="email_exibicao" value={email} disabled readOnly dica="É o e-mail de acesso à conta." />
          <Entrada rotulo="CNPJ" name="cnpj_exibicao" value={mascaraCnpj(buffet.cnpj)} disabled readOnly />
        </div>
      </Secao>

      <Secao Icone={MapPinned} titulo="Localização" descricao="Endereço do espaço e posição no mapa da busca.">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Entrada
            rotulo="Endereço"
            name="endereco"
            required
            placeholder="Rua, número, bairro"
            defaultValue={valor("endereco", buffet.endereco)}
            erro={erros.endereco}
          />
          <Entrada
            rotulo="Cidade"
            name="cidade"
            required
            placeholder="Ex.: São Paulo"
            defaultValue={valor("cidade", buffet.cidade)}
            erro={erros.cidade}
          />
        </div>
        <div className="mt-5">
          <SeletorLocalizacao latitude={buffet.latitude} longitude={buffet.longitude} erro={erros.localizacao} />
        </div>
      </Secao>

      <div className="sticky bottom-3 z-10 space-y-2">
        <MensagemAcao estado={estado} className="shadow-soft" />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 pl-5 shadow-lift backdrop-blur">
          <p className="text-sm text-slate-500">
            Campos com <span className="text-red-500">*</span> são obrigatórios.
          </p>
          <BotaoEnviar textoEnviando="Salvando...">
            <Save className="size-4" /> Salvar alterações
          </BotaoEnviar>
        </div>
      </div>
    </form>
  );
}

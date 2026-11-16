"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, Inbox, MailCheck, MousePointerClick, PartyPopper, Store, UserRoundPlus, type LucideIcon } from "lucide-react";
import { criarConta } from "@/controllers/conta";
import { estadoInicial } from "@/lib/acoes";
import { cn } from "@/lib/cn";
import { cnpjValido, cpfValido, mascaraCnpj, mascaraCpf, mascaraTelefone, somenteDigitos } from "@/lib/formatos";
import type { TipoUsuario } from "@/lib/database.types";
import { Alerta, MensagemAcao } from "@/components/ui/basicos";
import { BotaoEnviar, BotaoLink } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { CabecalhoFormulario } from "@/components/conta/cabecalho-formulario";
import { CampoSenha } from "@/components/conta/campo-senha";
import { useErrosCampos } from "@/components/conta/use-erros";

const OPCOES: { valor: TipoUsuario; titulo: string; texto: string; Icone: LucideIcon }[] = [
  { valor: "cliente", titulo: "Cliente", texto: "Organizo um evento", Icone: PartyPopper },
  { valor: "buffet", titulo: "Buffet", texto: "Ofereço o serviço", Icone: Store },
];

function SeletorTipo({ tipo, aoMudar }: { tipo: TipoUsuario; aoMudar: (t: TipoUsuario) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700">Você é</legend>
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5" role="radiogroup">
        {OPCOES.map(({ valor, titulo, texto, Icone }) => {
          const ativo = tipo === valor;
          return (
            <label
              key={valor}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 sm:px-4",
                ativo ? "bg-white shadow-soft ring-1 ring-slate-200/80" : "hover:bg-white/60",
              )}
            >
              <input type="radio" name="tipo" value={valor} checked={ativo} onChange={() => aoMudar(valor)} className="sr-only" />
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                  ativo ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/30" : "bg-white text-slate-400",
                )}
              >
                <Icone className="size-5" />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", ativo ? "text-slate-900" : "text-slate-600")}>{titulo}</span>
                <span className="block truncate text-xs text-slate-500">{texto}</span>
              </span>
              {ativo && <Check className="absolute right-2.5 top-2.5 hidden size-4 text-brand-600 sm:block" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CampoDocumento({ tipo, valorInicial, erroServidor }: { tipo: TipoUsuario; valorInicial?: string; erroServidor?: string }) {
  const ehCpf = tipo === "cliente";
  const [aviso, setAviso] = useState<string>();
  const nome = ehCpf ? "CPF" : "CNPJ";
  const tamanho = ehCpf ? 11 : 14;

  function conferir(valor: string, saindo: boolean) {
    const digitos = somenteDigitos(valor);
    if (digitos.length === tamanho) {
      setAviso((ehCpf ? cpfValido : cnpjValido)(digitos) ? undefined : `${nome} inválido. Confira os números.`);
    } else {
      setAviso(saindo && digitos.length > 0 ? `${nome} incompleto.` : undefined);
    }
  }

  return (
    <Entrada
      name={ehCpf ? "cpf" : "cnpj"}
      rotulo={nome}
      inputMode="numeric"
      autoComplete="off"
      placeholder={ehCpf ? "000.000.000-00" : "00.000.000/0000-00"}
      defaultValue={valorInicial}
      required
      erro={aviso ?? erroServidor}
      dica={ehCpf ? "Usado no contrato. Não aparece para os buffets." : "CNPJ da empresa que presta o serviço."}
      onChange={(e) => {
        e.currentTarget.value = (ehCpf ? mascaraCpf : mascaraCnpj)(e.currentTarget.value);
        conferir(e.currentTarget.value, false);
      }}
      onBlur={(e) => conferir(e.currentTarget.value, true)}
    />
  );
}

function ContaCriada({ email, mensagem }: { email?: string; mensagem?: string }) {
  const passos = [
    { Icone: Inbox, texto: "Abra a sua caixa de entrada" },
    { Icone: MousePointerClick, texto: "Clique no link de confirmação" },
    { Icone: Check, texto: "Pronto: você entra direto na sua área" },
  ];
  return (
    <div>
      <CabecalhoFormulario
        Icone={MailCheck}
        cor="verde"
        titulo="Confirme seu e-mail"
        subtitulo={
          email ? (
            <>
              Enviamos um link de confirmação para <strong className="font-semibold text-slate-800">{email}</strong>.
            </>
          ) : (
            mensagem
          )
        }
      />
      <ol className="space-y-3">
        {passos.map(({ Icone, texto }, i) => (
          <li key={texto} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
              <Icone className="size-4" />
            </span>
            <span className="text-sm text-slate-700">
              <span className="mr-1 font-semibold text-slate-400">{i + 1}.</span> {texto}
            </span>
          </li>
        ))}
      </ol>
      <Alerta tipo="info" className="mt-6">
        Não chegou? Aguarde alguns minutos e confira a caixa de spam ou promoções.
      </Alerta>
      <BotaoLink href="/login" tamanho="lg" className="mt-6 w-full">
        Ir para o login
      </BotaoLink>
    </div>
  );
}

/** T1.0 Cadastro (UC01): cliente (CPF) ou buffet (CNPJ + nome fantasia). */
export function FormCadastro({ tipoInicial = "cliente", next }: { tipoInicial?: TipoUsuario; next?: string }) {
  const [estado, acao] = useActionState(criarConta, estadoInicial);
  const [tipo, setTipo] = useState<TipoUsuario>(tipoInicial);
  const { erro, limpar } = useErrosCampos(estado);
  const v = estado.valores ?? {};

  if (estado.ok) return <ContaCriada email={v.email} mensagem={estado.mensagem} />;

  return (
    <>
      <CabecalhoFormulario
        Icone={UserRoundPlus}
        titulo="Criar conta"
        subtitulo="É grátis e leva menos de um minuto. Todos os campos são obrigatórios."
      />
      <form action={acao} onChange={limpar} noValidate className="space-y-5">
        <MensagemAcao estado={estado} />
        {next && <input type="hidden" name="next" value={next} />}
        <SeletorTipo tipo={tipo} aoMudar={setTipo} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Entrada
            name="nome"
            rotulo={tipo === "buffet" ? "Nome do responsável" : "Nome completo"}
            placeholder={tipo === "buffet" ? "Quem vai cuidar da conta" : "Como está no seu documento"}
            autoComplete="name"
            defaultValue={v.nome}
            erro={erro("nome")}
            required
            classeContainer="sm:col-span-2"
          />

          {tipo === "buffet" && (
            <>
              <Entrada
                name="nome_fantasia"
                rotulo="Nome fantasia"
                placeholder="Ex.: Buffet Jardim das Festas"
                autoComplete="organization"
                defaultValue={v.nome_fantasia}
                erro={erro("nome_fantasia")}
                required
                dica="É o nome que os clientes verão na busca."
              />
              <CampoDocumento key="cnpj" tipo="buffet" valorInicial={v.cnpj} erroServidor={erro("cnpj")} />
            </>
          )}

          <Entrada
            name="email"
            type="email"
            rotulo="E-mail"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            defaultValue={v.email}
            erro={erro("email")}
            required
          />
          <Entrada
            name="telefone"
            type="tel"
            rotulo="Telefone"
            inputMode="numeric"
            placeholder="(11) 98888-0000"
            autoComplete="tel-national"
            defaultValue={v.telefone}
            erro={erro("telefone")}
            required
            onChange={(e) => {
              e.currentTarget.value = mascaraTelefone(e.currentTarget.value);
            }}
          />

          {tipo === "cliente" && <CampoDocumento key="cpf" tipo="cliente" valorInicial={v.cpf} erroServidor={erro("cpf")} />}

          <div className={cn(tipo === "buffet" && "sm:col-span-2")}>
            <CampoSenha
              name="senha"
              rotulo="Senha"
              autoComplete="new-password"
              minLength={8}
              mostrarForca
              erro={erro("senha")}
              dica="Mínimo de 8 caracteres. Misture letras, números e símbolos."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-[:checked]:border-brand-200 has-[:checked]:bg-brand-50/60",
              erro("aceite") ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/60 hover:border-slate-300",
            )}
          >
            <input
              type="checkbox"
              name="aceite"
              defaultChecked={v.aceite === "on"}
              aria-invalid={!!erro("aceite")}
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-brand-600"
            />
            <span className="text-sm leading-relaxed text-slate-600">
              Li e aceito a{" "}
              <Link href="/privacidade" target="_blank" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                Política de Privacidade e os Termos de Uso
              </Link>{" "}
              e autorizo o uso dos meus dados para usar a plataforma, conforme a LGPD (Lei 13.709/2018).
            </span>
          </label>
          {erro("aceite") && <p className="text-xs font-medium text-red-600">{erro("aceite")}</p>}
        </div>

        <BotaoEnviar tamanho="lg" className="w-full" textoEnviando="Criando sua conta…">
          Criar conta
        </BotaoEnviar>

        <p className="text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </form>
    </>
  );
}

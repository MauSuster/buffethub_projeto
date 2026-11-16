"use client";

import { startTransition, useActionState, useState } from "react";
import { Barcode, Clock, CreditCard, Loader2, Lock, QrCode, RotateCw, XCircle, type LucideIcon } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { Alerta } from "@/components/ui/basicos";
import { cn } from "@/lib/cn";
import { data as dataBR, moeda, somenteDigitos } from "@/lib/formatos";
import type { MetodoPagamento } from "@/lib/database.types";
import { pagarContratoAcao, type EstadoPagamento } from "@/controllers/cliente";
import { BotaoCopiar } from "@/components/cliente/botao-copiar";
import { CodigoBarras, QrCodePix } from "@/components/cliente/qr-code-pix";
import { diasEntre, geradorDeterministico, somarDias } from "@/components/cliente/utilidades";

const ABAS: { metodo: MetodoPagamento; Icone: LucideIcon }[] = [
  { metodo: "Pix", Icone: QrCode },
  { metodo: "Cartão", Icone: CreditCard },
  { metodo: "Boleto", Icone: Barcode },
];

const estadoInicialPagamento: EstadoPagamento = {};

function digitosAleatorios(aleatorio: () => number, quantidade: number) {
  return Array.from({ length: quantidade }, () => Math.floor(aleatorio() * 10)).join("");
}

function codigoPix(contratoId: string, valor: number) {
  const v = valor.toFixed(2);
  const ref = contratoId.replace(/-/g, "").slice(0, 10).toUpperCase();
  const crc = Math.floor(geradorDeterministico(contratoId + "pix")() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `00020126360014BR.GOV.BCB.PIX0114BUFFETHUBTESTE52040000530398654${String(v.length).padStart(2, "0")}${v}5802BR5909BUFFETHUB6009SAO PAULO62140510${ref}6304${crc}`;
}

function linhaDigitavel(contratoId: string, valor: number, vencimento: string) {
  const aleatorio = geradorDeterministico(contratoId + "boleto");
  const b1 = digitosAleatorios(aleatorio, 10);
  const b2 = digitosAleatorios(aleatorio, 11);
  const b3 = digitosAleatorios(aleatorio, 11);
  const dv = digitosAleatorios(aleatorio, 1);
  const fator = String(1000 + diasEntre("2025-02-22", vencimento)).padStart(4, "0");
  const centavos = String(Math.round(valor * 100)).padStart(10, "0").slice(-10);
  return `${b1.slice(0, 5)}.${b1.slice(5)} ${b2.slice(0, 5)}.${b2.slice(5)} ${b3.slice(0, 5)}.${b3.slice(5)} ${dv} ${fator}${centavos}`;
}

function mascaraCartao(valor: string) {
  return somenteDigitos(valor).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function mascaraValidade(valor: string) {
  const d = somenteDigitos(valor).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function bandeira(numero: string) {
  const d = somenteDigitos(numero);
  if (/^4/.test(d)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "MASTERCARD";
  if (/^3[47]/.test(d)) return "AMEX";
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(d)) return "ELO";
  return "";
}

function PreviaCartao({ numero, nome, validade }: { numero: string; nome: string; validade: string }) {
  const digitos = somenteDigitos(numero);
  const final = digitos.slice(-4).padStart(4, "•");
  return (
    <div className="relative aspect-[1.7/1] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-5 text-white shadow-lift">
      <div className="absolute -top-16 -right-10 size-48 rounded-full bg-accent-400/25 blur-2xl" aria-hidden />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="h-7 w-10 rounded-md bg-gradient-to-br from-accent-200 to-accent-400" aria-hidden />
          <span className="text-xs font-bold tracking-widest text-white/80">{bandeira(numero)}</span>
        </div>
        <p className="font-mono text-lg tracking-[0.18em] sm:text-xl">•••• •••• •••• {final}</p>
        <div className="flex items-end justify-between gap-3 text-[11px] uppercase">
          <div className="min-w-0">
            <p className="text-white/50">Nome</p>
            <p className="truncate font-semibold tracking-wide">{nome || "NOME IMPRESSO"}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50">Validade</p>
            <p className="font-semibold">{validade || "MM/AA"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** T6.0 Checkout (UC14): Pix, cartão ou boleto. Pagamento simulado pela função pagar_contrato do banco. */
export function Checkout({ contratoId, valor, hoje }: { contratoId: string; valor: number; hoje: string }) {
  const [metodo, setMetodo] = useState<MetodoPagamento>("Pix");
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [mostrarResultado, setMostrarResultado] = useState(true);
  const [estado, pagar, pendente] = useActionState(pagarContratoAcao.bind(null, contratoId), estadoInicialPagamento);

  const vencimento = somarDias(hoje, 3);
  const pix = codigoPix(contratoId, valor);
  const linha = linhaDigitavel(contratoId, valor, vencimento);
  const erros = mostrarResultado ? (estado.erros ?? {}) : {};

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMostrarResultado(true);
    const dados = new FormData(e.currentTarget);
    startTransition(() => pagar(dados));
  }

  function trocarMetodo(m: MetodoPagamento) {
    setMetodo(m);
    setMostrarResultado(false);
  }

  function tentarDeNovo() {
    setMostrarResultado(false);
    setNumero("");
    setCvv("");
    document.getElementById("numero_cartao")?.focus();
  }

  const textoBotao =
    metodo === "Cartão"
      ? `Pagar ${moeda(valor)}`
      : metodo === "Pix"
        ? "Já paguei (simular confirmação)"
        : "Confirmar pagamento do boleto (simular)";

  return (
    <div className="card p-5 sm:p-7">
      <h2 className="text-lg font-bold text-slate-900">Forma de pagamento</h2>

      <div role="tablist" aria-label="Forma de pagamento" className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
        {ABAS.map(({ metodo: m, Icone }) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={metodo === m}
            onClick={() => trocarMetodo(m)}
            disabled={pendente}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
              metodo === m ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
            )}
          >
            <Icone className="size-4" /> {m}
          </button>
        ))}
      </div>

      <Alerta tipo="aviso" titulo="Ambiente de testes" className="mt-4">
        Nenhum valor é cobrado. O cartão terminado em <strong>0002</strong> simula um pagamento recusado; Pix, boleto e outros
        cartões são aprovados.
      </Alerta>

      <form onSubmit={enviar} className="mt-5 space-y-5" aria-busy={pendente} noValidate>
        <input type="hidden" name="metodo" value={metodo} />

        {mostrarResultado && estado.recusado && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
              <XCircle className="size-6" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-red-800">Pagamento recusado</p>
              <p className="text-sm text-red-700">{estado.mensagem}</p>
            </div>
            <Botao type="button" variante="perigo" onClick={tentarDeNovo}>
              <RotateCw className="size-4" /> Tentar de novo
            </Botao>
          </div>
        )}
        {mostrarResultado && !estado.recusado && estado.mensagem && (
          <Alerta tipo="erro" titulo="Não foi possível concluir o pagamento">
            {estado.mensagem}
          </Alerta>
        )}

        {metodo === "Pix" && (
          <div className="grid items-center gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div className="mx-auto w-48 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:w-full">
              <QrCodePix semente={contratoId} className="w-full" />
            </div>
            <div className="min-w-0 space-y-3 text-sm text-slate-600">
              <p>
                Abra o app do seu banco, escolha <strong>Pagar com Pix</strong> e escaneie o QR Code ou use o código copia e cola.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{pix}</code>
                <BotaoCopiar texto={pix} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="size-3.5" /> QR Code ilustrativo, gerado só para a simulação.
              </p>
            </div>
          </div>
        )}

        {metodo === "Cartão" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex justify-center xl:items-start">
              <PreviaCartao numero={numero} nome={nome} validade={validade} />
            </div>
            <div className="space-y-4">
              <Entrada
                name="numero_cartao"
                rotulo="Número do cartão"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={numero}
                onChange={(e) => setNumero(mascaraCartao(e.target.value))}
                erro={erros.numero_cartao}
                required
              />
              <Entrada
                name="nome_cartao"
                rotulo="Nome impresso no cartão"
                autoComplete="cc-name"
                placeholder="COMO ESTÁ NO CARTÃO"
                value={nome}
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                erro={erros.nome_cartao}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Entrada
                  name="validade_cartao"
                  rotulo="Validade"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={validade}
                  onChange={(e) => setValidade(mascaraValidade(e.target.value))}
                  erro={erros.validade_cartao}
                  required
                />
                <Entrada
                  name="cvv"
                  rotulo="CVV"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(somenteDigitos(e.target.value).slice(0, 4))}
                  erro={erros.cvv}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {metodo === "Boleto" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">Boleto BuffetHub (fictício)</span>
                <span className="text-slate-500">
                  Vencimento: <strong className="text-slate-800">{dataBR(vencimento)}</strong>
                </span>
              </div>
              <CodigoBarras digitos={somenteDigitos(linha)} className="mt-4 h-14 w-full" />
              <p className="mt-3 font-mono text-xs break-all text-slate-700 sm:text-sm">{linha}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{moeda(valor)}</p>
                <BotaoCopiar texto={somenteDigitos(linha)} rotulo="Copiar linha digitável" />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Na vida real o boleto leva até 3 dias úteis para compensar. Aqui a confirmação é simulada na hora.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Botao type="submit" variante="destaque" tamanho="lg" className="w-full" disabled={pendente}>
            {pendente ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Processando pagamento...
              </>
            ) : (
              textoBotao
            )}
          </Botao>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Lock className="size-3.5 shrink-0" />
            {metodo === "Cartão"
              ? "Só o número do cartão vai para a simulação; nome, validade e CVV não são guardados."
              : "Pagamento seguro, processado pelo gateway de pagamento (simulado)."}
          </p>
        </div>
      </form>
    </div>
  );
}

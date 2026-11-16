"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { recuperarSenha } from "@/controllers/conta";
import { estadoInicial } from "@/lib/acoes";
import { Alerta } from "@/components/ui/basicos";
import { BotaoEnviar } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { useErrosCampos } from "@/components/conta/use-erros";

/** T3.0 Recuperação de senha, passo 1 (UC02 A1). */
export function FormRecuperar() {
  const [estado, acao] = useActionState(recuperarSenha, estadoInicial);
  const { erro, limpar } = useErrosCampos(estado);

  return (
    <form action={acao} onChange={limpar} noValidate className="space-y-5">
      {estado.ok && (
        <Alerta tipo="sucesso" titulo="Confira seu e-mail">
          {estado.mensagem}
        </Alerta>
      )}

      <Entrada
        name="email"
        type="email"
        rotulo="E-mail da conta"
        placeholder="voce@exemplo.com"
        autoComplete="email"
        defaultValue={estado.valores?.email}
        erro={erro("email")}
        required
      />

      <BotaoEnviar tamanho="lg" className="w-full" textoEnviando="Enviando link…">
        <Send className="size-4" />
        {estado.ok ? "Enviar de novo" : "Enviar link"}
      </BotaoEnviar>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Voltar ao login
      </Link>
    </form>
  );
}

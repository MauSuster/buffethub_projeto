"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { entrar } from "@/controllers/conta";
import { estadoInicial } from "@/lib/acoes";
import { MensagemAcao } from "@/components/ui/basicos";
import { BotaoEnviar, BotaoLink } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { CampoSenha } from "@/components/conta/campo-senha";
import { useErrosCampos } from "@/components/conta/use-erros";

/** T2.0 Login (UC02). `next` é o caminho interno para onde o usuário volta depois de entrar. */
export function FormLogin({ next }: { next?: string }) {
  const [estado, acao] = useActionState(entrar, estadoInicial);
  const { erro, limpar } = useErrosCampos(estado);
  const linkCadastro = next ? `/cadastro?next=${encodeURIComponent(next)}` : "/cadastro";

  return (
    <form action={acao} onChange={limpar} noValidate className="space-y-5">
      <MensagemAcao estado={estado} />
      {next && <input type="hidden" name="next" value={next} />}

      <Entrada
        name="email"
        type="email"
        rotulo="E-mail"
        placeholder="voce@exemplo.com"
        autoComplete="email"
        autoFocus
        defaultValue={estado.valores?.email}
        erro={erro("email")}
        required
      />
      <CampoSenha
        name="senha"
        rotulo="Senha"
        autoComplete="current-password"
        erro={erro("senha")}
        acaoRotulo={
          <Link href="/recuperar-senha" className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
            Esqueci minha senha
          </Link>
        }
      />

      <BotaoEnviar tamanho="lg" className="w-full" textoEnviando="Entrando…">
        <LogIn className="size-4" />
        Entrar
      </BotaoEnviar>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Novo por aqui?
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <BotaoLink href={linkCadastro} variante="secundario" tamanho="lg" className="w-full">
        Criar conta grátis
      </BotaoLink>
    </form>
  );
}

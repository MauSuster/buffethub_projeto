"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheckBig, KeyRound, Loader2 } from "lucide-react";
import { redefinirSenha } from "@/controllers/conta";
import { estadoInicial } from "@/lib/acoes";
import { MensagemAcao } from "@/components/ui/basicos";
import { BotaoEnviar, BotaoLink } from "@/components/ui/botao";
import { CabecalhoFormulario } from "@/components/conta/cabecalho-formulario";
import { CampoSenha } from "@/components/conta/campo-senha";
import { useErrosCampos } from "@/components/conta/use-erros";

const ESPERA_REDIRECIONAR_MS = 2500;

/** T3.0 Recuperação de senha, passo 2: tela aberta pelo link do e-mail. Depois de salvar, leva o usuário para a área dele. */
export function FormRedefinir({ destino }: { destino: string }) {
  const [estado, acao] = useActionState(redefinirSenha, estadoInicial);
  const { erro, limpar } = useErrosCampos(estado);
  const router = useRouter();

  useEffect(() => {
    if (!estado.ok) return;
    const espera = setTimeout(() => router.replace(destino), ESPERA_REDIRECIONAR_MS);
    return () => clearTimeout(espera);
  }, [estado, destino, router]);

  if (estado.ok) {
    return (
      <div>
        <CabecalhoFormulario Icone={CircleCheckBig} cor="verde" titulo="Senha alterada!" subtitulo={estado.mensagem} />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Redirecionando…
        </div>
        <BotaoLink href={destino} replace tamanho="lg" className="mt-6 w-full">
          Ir agora para minha área
          <ArrowRight className="size-4" />
        </BotaoLink>
      </div>
    );
  }

  return (
    <>
      <CabecalhoFormulario
        Icone={KeyRound}
        etapa="Passo 2 de 2"
        titulo="Definir nova senha"
        subtitulo="Escolha uma senha nova que você não use em outros sites."
      />
      <form action={acao} onChange={limpar} noValidate className="space-y-5">
        <MensagemAcao estado={estado} />
        <CampoSenha
          name="senha"
          rotulo="Nova senha"
          autoComplete="new-password"
          minLength={8}
          mostrarForca
          erro={erro("senha")}
          dica="Mínimo de 8 caracteres. Misture letras, números e símbolos."
        />
        <CampoSenha name="confirmar_senha" rotulo="Confirmar nova senha" autoComplete="new-password" erro={erro("confirmar_senha")} />

        <BotaoEnviar tamanho="lg" className="w-full" textoEnviando="Salvando…">
          Salvar nova senha
        </BotaoEnviar>

        <p className="text-center text-sm text-slate-500">
          O link expirou?{" "}
          <Link href="/recuperar-senha" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            Pedir um novo link
          </Link>
        </p>
      </form>
    </>
  );
}

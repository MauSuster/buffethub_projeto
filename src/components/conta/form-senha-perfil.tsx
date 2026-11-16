"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { alterarSenha } from "@/controllers/conta";
import type { EstadoAcao } from "@/lib/acoes";
import { MensagemAcao } from "@/components/ui/basicos";
import { BotaoEnviar } from "@/components/ui/botao";
import { CampoSenha } from "@/components/conta/campo-senha";
import { useErrosCampos } from "@/components/conta/use-erros";

type EstadoSenha = EstadoAcao & { versao?: number };

/** A cada troca bem-sucedida a versão muda e os campos de senha são recriados vazios. */
async function alterarComVersao(anterior: EstadoSenha, form: FormData): Promise<EstadoSenha> {
  const resultado = await alterarSenha(anterior, form);
  return { ...resultado, versao: (anterior.versao ?? 0) + (resultado.ok ? 1 : 0) };
}

/** UC16: troca de senha opcional na tela Meu perfil. */
export function FormSenhaPerfil() {
  const [estado, acao] = useActionState(alterarComVersao, {});
  const { erro, limpar } = useErrosCampos(estado);

  return (
    <form action={acao} onChange={limpar} noValidate className="space-y-5">
      <MensagemAcao estado={estado} />
      <div key={estado.versao ?? 0} className="grid gap-5 lg:grid-cols-3">
        <CampoSenha name="senha_atual" rotulo="Senha atual" autoComplete="current-password" erro={erro("senha_atual")} />
        <CampoSenha
          name="nova_senha"
          rotulo="Nova senha"
          autoComplete="new-password"
          minLength={8}
          mostrarForca
          erro={erro("nova_senha")}
          dica="Mínimo de 8 caracteres."
        />
        <CampoSenha name="confirmar_senha" rotulo="Confirmar nova senha" autoComplete="new-password" erro={erro("confirmar_senha")} />
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <BotaoEnviar variante="secundario" textoEnviando="Alterando…" className="w-full sm:w-auto">
          <KeyRound className="size-4" />
          Alterar senha
        </BotaoEnviar>
      </div>
    </form>
  );
}

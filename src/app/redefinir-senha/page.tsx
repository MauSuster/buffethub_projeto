import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LockKeyhole, MailCheck, ShieldCheck, TimerOff } from "lucide-react";
import { areaInicial, obterSessao } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";
import { BotaoLink } from "@/components/ui/botao";
import { CabecalhoFormulario } from "@/components/conta/cabecalho-formulario";
import { FormRedefinir } from "@/components/conta/form-redefinir";
import { LayoutAutenticacao } from "@/components/conta/layout-autenticacao";

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Crie uma nova senha para a sua conta do BuffetHub.",
};

const DICAS = [
  { Icone: KeyRound, titulo: "Senha forte", texto: "Pelo menos 8 caracteres, com letras, números e símbolos." },
  { Icone: LockKeyhole, titulo: "Só sua", texto: "Não repita a senha de outros sites nem compartilhe com ninguém." },
  { Icone: ShieldCheck, titulo: "Conta protegida", texto: "Depois de salvar, a senha antiga deixa de funcionar." },
];

// T3.0 Recuperação de senha, passo 2: só funciona com a sessão criada pelo link do e-mail (/auth/callback).
export default async function PaginaRedefinirSenha() {
  const sessao = await obterSessao();
  let logado = !!sessao;
  if (!logado) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.auth.getUser();
    logado = !!data.user;
  }

  return (
    <LayoutAutenticacao
      titulo="Quase lá!"
      texto="Defina a nova senha e continue acompanhando seus eventos no BuffetHub."
      destaques={DICAS}
    >
      {logado ? (
        <FormRedefinir destino={sessao ? areaInicial(sessao.tipo) : "/"} />
      ) : (
        <div>
          <CabecalhoFormulario
            Icone={TimerOff}
            cor="ambar"
            titulo="Link inválido ou expirado"
            subtitulo="Para criar uma nova senha, abra esta página pelo link que enviamos ao seu e-mail. Se o link já foi usado ou expirou, peça outro."
          />
          <BotaoLink href="/recuperar-senha" tamanho="lg" className="w-full">
            <MailCheck className="size-4" />
            Pedir um novo link
          </BotaoLink>
          <p className="mt-5 text-center text-sm text-slate-500">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      )}
    </LayoutAutenticacao>
  );
}

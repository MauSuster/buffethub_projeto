import type { Metadata } from "next";
import { KeyRound, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { CabecalhoFormulario } from "@/components/conta/cabecalho-formulario";
import { FormRecuperar } from "@/components/conta/form-recuperar";
import { LayoutAutenticacao } from "@/components/conta/layout-autenticacao";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba por e-mail um link para criar uma nova senha no BuffetHub.",
};

const PASSOS = [
  { Icone: Mail, titulo: "1. Informe seu e-mail", texto: "O mesmo que você usa para entrar no BuffetHub." },
  { Icone: MailCheck, titulo: "2. Abra o link que enviamos", texto: "Ele vale por pouco tempo e só pode ser usado uma vez." },
  { Icone: ShieldCheck, titulo: "3. Crie a nova senha", texto: "Pronto: você volta direto para a sua área." },
];

// T3.0 Recuperação de senha, passo 1 (UC02 A1)
export default function PaginaRecuperarSenha() {
  return (
    <LayoutAutenticacao
      titulo="Esqueceu a senha? Acontece."
      texto="Em poucos passos você cria uma nova senha e volta a negociar com os buffets."
      destaques={PASSOS}
    >
      <CabecalhoFormulario
        Icone={KeyRound}
        etapa="Passo 1 de 2"
        titulo="Recuperar senha"
        subtitulo="Informe o e-mail da sua conta para receber o link de recuperação."
      />
      <FormRecuperar />
    </LayoutAutenticacao>
  );
}

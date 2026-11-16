import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";
import { destinoSeguro } from "@/components/conta/destino";

// Destino dos links enviados por e-mail (confirmação de cadastro e recuperação de senha):
// troca o código do link por uma sessão e manda o usuário para `next`.
export async function GET(request: NextRequest) {
  const busca = request.nextUrl.searchParams;
  const codigo = busca.get("code");
  const tokenHash = busca.get("token_hash");
  const tipo = busca.get("type") as EmailOtpType | null;
  const destino = destinoSeguro(busca.get("next")) ?? "/";

  let valido = false;
  if (codigo) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    valido = !error;
  } else if (tokenHash && tipo) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    valido = !error;
  }

  return NextResponse.redirect(new URL(valido ? destino : "/login?erro=link", request.nextUrl.origin));
}

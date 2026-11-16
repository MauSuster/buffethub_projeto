import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AREAS_LOGADAS = ["/cliente", "/anfitriao", "/pagamento"];

// Renova a sessão do Supabase a cada requisição e manda para o login quem tenta abrir uma área logada sem estar logado.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista, headers) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const caminho = request.nextUrl.pathname;

  if (!data?.claims && AREAS_LOGADAS.some((area) => caminho.startsWith(area))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(caminho + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|demo/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

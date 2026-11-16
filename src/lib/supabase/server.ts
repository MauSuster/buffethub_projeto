import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Cliente do Supabase com a sessão do usuário (cookies). Use em Server Components, Server Actions e Route Handlers. */
export async function criarClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient<Database>(URL, CHAVE, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Em Server Components não dá para gravar cookies; o proxy.ts renova a sessão.
        }
      },
    },
  });
}

/** Cliente sem sessão, só para dados públicos (busca e perfil dos buffets). */
export function criarClientePublico() {
  return createClient<Database>(URL, CHAVE, { auth: { persistSession: false, autoRefreshToken: false } });
}

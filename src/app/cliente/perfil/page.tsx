import type { Metadata } from "next";
import { CalendarDays, IdCard, Mail, Phone, ShieldCheck, UserRoundPen } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";
import { iniciais } from "@/lib/formatos";
import { Alerta, Cartao, Selo, TituloPagina } from "@/components/ui/basicos";
import { FormPerfil } from "@/components/conta/form-perfil";
import { FormSenhaPerfil } from "@/components/conta/form-senha-perfil";

export const metadata: Metadata = { title: "Meu perfil" };

/** "39053344705" → "***.533.447-**": o CPF completo não precisa aparecer na tela. */
function cpfOculto(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return "***.***.***-**";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

function membroDesde(iso: string) {
  const texto = new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// T7.5 Meu perfil (UC16 Editar Perfil)
export default async function PaginaPerfil() {
  const sessao = await exigirCliente("/cliente/perfil");
  const supabase = await criarClienteServidor();
  const [{ data: usuario }, { data: cliente }] = await Promise.all([
    supabase.from("usuario").select("nome, email, telefone, data_cadastro").eq("id", sessao.id).maybeSingle(),
    supabase.from("cliente").select("cpf, preferencias").eq("usuario_id", sessao.id).maybeSingle(),
  ]);

  if (!usuario || !cliente) {
    return (
      <>
        <TituloPagina titulo="Meu perfil" />
        <Alerta tipo="erro" titulo="Não foi possível carregar seu perfil">
          Atualize a página em alguns instantes. Se o problema continuar, saia e entre novamente.
        </Alerta>
      </>
    );
  }

  const cpf = cpfOculto(cliente.cpf);
  const resumo = [
    { Icone: Mail, rotulo: "E-mail", valor: usuario.email },
    { Icone: Phone, rotulo: "Telefone", valor: usuario.telefone ?? "Não informado" },
    { Icone: IdCard, rotulo: "CPF", valor: cpf },
    { Icone: CalendarDays, rotulo: "Cliente desde", valor: membroDesde(usuario.data_cadastro) },
  ];

  return (
    <>
      <TituloPagina titulo="Meu perfil" subtitulo="Mantenha seus dados em dia para negociar com os buffets sem imprevistos." />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Cartao className="h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="hero-gradient h-24" />
          <div className="-mt-10 px-6 pb-6">
            <span className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-lift ring-4 ring-white">
              {iniciais(usuario.nome)}
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{usuario.nome}</h2>
            <Selo cor="azul" className="mt-2">
              Cliente
            </Selo>
            <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              {resumo.map(({ Icone, rotulo, valor }) => (
                <div key={rotulo} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                    <Icone className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-400">{rotulo}</dt>
                    <dd className="truncate text-sm font-medium text-slate-700" title={valor}>
                      {valor}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Cartao>

        <div className="min-w-0 space-y-6">
          <Cartao className="p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <UserRoundPen className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Dados pessoais e preferências</h2>
                <p className="text-sm text-slate-500">Altere o que precisar e clique em “Salvar alterações”.</p>
              </div>
            </div>
            <FormPerfil
              salvos={{
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone ?? "",
                cpfOculto: cpf,
                preferencias: cliente.preferencias ?? "",
              }}
            />
          </Cartao>

          <Cartao className="p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Segurança</h2>
                <p className="text-sm text-slate-500">Troque sua senha quando quiser. Opcional.</p>
              </div>
            </div>
            <FormSenhaPerfil />
          </Cartao>
        </div>
      </div>
    </>
  );
}

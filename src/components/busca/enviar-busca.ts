import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Envia o formulário de busca como GET para "/", sem campos vazios na URL. */
export function useEnviarBusca() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  function enviar(form: HTMLFormElement) {
    const params = new URLSearchParams();
    new FormData(form).forEach((valor, nome) => {
      if (typeof valor === "string" && valor.trim()) params.append(nome, valor.trim());
    });
    const consulta = params.toString();
    iniciar(() => router.push(consulta ? `/?${consulta}` : "/", { scroll: false }));
  }

  return { enviar, pendente };
}

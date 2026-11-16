"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Images, Loader2, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { traduzirErro } from "@/lib/acoes";
import type { MidiaPortfolio } from "@/lib/database.types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { registrarFotoPortfolio, removerFotoPortfolio } from "@/controllers/anfitriao";
import { Botao } from "@/components/ui/botao";
import { Alerta, Cartao, Foto, Selo } from "@/components/ui/basicos";
import { EXTENSOES_FOTO, TAMANHO_MAXIMO_FOTO } from "./constantes";

type Aviso = { tipo: "sucesso" | "erro"; texto: string };

/** UC17: portfólio do buffet. As fotos vão direto para o Storage, na pasta do próprio buffet. */
export function Portfolio({ buffetId, fotos }: { buffetId: string; fotos: MidiaPortfolio[] }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  async function enviar(arquivos: File[]) {
    if (enviando > 0 || arquivos.length === 0) return;
    const resultado: Aviso[] = [];
    // UC17 E2: formato ou tamanho não aceito
    const validos = arquivos.filter((arquivo) => {
      if (!EXTENSOES_FOTO[arquivo.type]) {
        resultado.push({ tipo: "erro", texto: `“${arquivo.name}” não foi enviada: use fotos JPG, PNG ou WEBP.` });
        return false;
      }
      if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
        resultado.push({ tipo: "erro", texto: `“${arquivo.name}” não foi enviada: o limite é 5 MB por foto.` });
        return false;
      }
      return true;
    });
    setAvisos(resultado);
    if (validos.length === 0) return;

    setEnviando(validos.length);
    const supabase = criarClienteNavegador();
    let enviadas = 0;
    for (const arquivo of validos) {
      const caminho = `${buffetId}/${crypto.randomUUID()}.${EXTENSOES_FOTO[arquivo.type]}`;
      const envio = await supabase.storage
        .from("portfolio")
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (envio.error) {
        resultado.push({ tipo: "erro", texto: `“${arquivo.name}”: ${traduzirErro(envio.error, "não foi possível enviar a foto.")}` });
      } else {
        const registro = await registrarFotoPortfolio(caminho);
        if (registro.ok) enviadas++;
        else {
          await supabase.storage.from("portfolio").remove([caminho]);
          resultado.push({ tipo: "erro", texto: `“${arquivo.name}”: ${registro.mensagem ?? "não foi possível salvar a foto."}` });
        }
      }
      setEnviando((n) => n - 1);
    }
    if (enviadas > 0) {
      resultado.unshift({
        tipo: "sucesso",
        texto: enviadas === 1 ? "Foto adicionada ao portfólio." : `${enviadas} fotos adicionadas ao portfólio.`,
      });
    }
    setAvisos(resultado);
  }

  function remover(id: string) {
    setRemovendo(id);
    iniciarTransicao(async () => {
      const r = await removerFotoPortfolio(id);
      setAvisos([{ tipo: r.ok ? "sucesso" : "erro", texto: r.mensagem ?? "" }]);
      setRemovendo(null);
      setConfirmando(null);
    });
  }

  return (
    <Cartao id="portfolio" className="scroll-mt-24 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Images className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Portfólio</h2>
            <p className="text-sm text-slate-500">
              As fotos são salvas na hora. A primeira foto é a capa do seu perfil.
            </p>
          </div>
        </div>
        <Botao type="button" variante="secundario" tamanho="sm" onClick={() => entrada.current?.click()} disabled={enviando > 0}>
          <ImagePlus className="size-4" /> Adicionar fotos
        </Botao>
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const lista = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          void enviar(lista);
        }}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void enviar(Array.from(e.dataTransfer.files));
        }}
        disabled={enviando > 0}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          arrastando ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/50",
          enviando > 0 && "cursor-wait opacity-70",
        )}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-soft">
          {enviando > 0 ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </span>
        <span className="text-sm font-semibold text-slate-700">
          {enviando > 0
            ? `Enviando ${enviando === 1 ? "1 foto" : `${enviando} fotos`}...`
            : "Arraste fotos para cá ou clique para escolher"}
        </span>
        <span className="text-xs text-slate-500">JPG, PNG ou WEBP, até 5 MB cada</span>
      </button>

      {avisos.length > 0 && (
        <div className="mt-4 space-y-2" aria-live="polite">
          {avisos.map((aviso, i) => (
            <Alerta key={i} tipo={aviso.tipo}>
              {aviso.texto}
            </Alerta>
          ))}
        </div>
      )}

      {fotos.length === 0 && enviando === 0 ? (
        <p className="mt-5 text-center text-sm text-slate-500">
          Seu portfólio ainda está vazio. Perfis com fotos recebem muito mais pedidos de orçamento.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <li key={foto.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70">
              <Foto src={foto.url} alt={foto.descricao ?? `Foto ${i + 1} do portfólio`} className="size-full" />
              {i === 0 && (
                <Selo cor="amarelo" className="absolute left-2 top-2 shadow-sm">
                  Capa
                </Selo>
              )}
              {confirmando === foto.id ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70 p-3 text-center backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Remover esta foto?</p>
                  <div className="flex gap-2">
                    <Botao
                      type="button"
                      tamanho="sm"
                      variante="secundario"
                      onClick={() => setConfirmando(null)}
                      disabled={removendo === foto.id}
                    >
                      Cancelar
                    </Botao>
                    <Botao
                      type="button"
                      tamanho="sm"
                      variante="perigo"
                      onClick={() => remover(foto.id)}
                      disabled={removendo === foto.id}
                    >
                      {removendo === foto.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      Remover
                    </Botao>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(foto.id)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
          {Array.from({ length: enviando }, (_, i) => (
            <li key={`enviando-${i}`} className="grid aspect-[4/3] animate-pulse place-items-center rounded-xl bg-slate-100">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}

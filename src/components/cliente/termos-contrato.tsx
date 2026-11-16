const ROTULO = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,}):\s?(.*)$/;
const CLAUSULA = /^(\d+)\.\s+(.*)$/;

/** Termos do contrato com os rótulos em destaque e as cláusulas numeradas, para leitura confortável. */
export function TermosContrato({ termos }: { termos: string }) {
  const [titulo, ...linhas] = termos.split("\n");
  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fffdf8] px-5 py-6 text-[15px] leading-7 text-slate-700 shadow-inner sm:px-10 sm:py-10">
      <h3 className="mb-5 text-center text-sm font-bold tracking-[0.15em] text-slate-900 sm:text-base">{titulo}</h3>
      <div className="mx-auto max-w-prose space-y-1 whitespace-pre-wrap">
        {linhas.map((linha, i) => {
          if (!linha.trim()) return <div key={i} className="h-3" aria-hidden />;
          const clausula = CLAUSULA.exec(linha);
          if (clausula) {
            return (
              <p key={i} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  {clausula[1]}
                </span>
                <span>{clausula[2]}</span>
              </p>
            );
          }
          const rotulo = ROTULO.exec(linha);
          if (rotulo) {
            return (
              <p key={i}>
                <span className="font-semibold tracking-wide text-slate-900">{rotulo[1]}:</span>
                {rotulo[2] && ` ${rotulo[2]}`}
              </p>
            );
          }
          return <p key={i}>{linha}</p>;
        })}
      </div>
    </article>
  );
}

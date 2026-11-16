function Barra({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />;
}

export function EsqueletoResultados() {
  return (
    <div aria-busy="true" aria-label="Carregando buffets">
      <div className="mb-4 flex items-center justify-between">
        <Barra className="h-7 w-56" />
        <Barra className="h-10 w-40 rounded-xl" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col overflow-hidden sm:flex-row">
            <div className="aspect-[16/10] animate-pulse bg-slate-200/70 sm:aspect-auto sm:h-48 sm:w-56" />
            <div className="flex-1 space-y-3 p-5">
              <Barra className="h-5 w-2/3" />
              <Barra className="h-4 w-1/3" />
              <Barra className="h-4 w-4/5" />
              <div className="flex gap-2">
                <Barra className="h-5 w-20" />
                <Barra className="h-5 w-16" />
              </div>
              <div className="flex justify-between pt-2">
                <Barra className="h-8 w-28 rounded-lg" />
                <Barra className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EsqueletoComparacao({ colunas }: { colunas: number }) {
  return (
    <div className="card overflow-hidden" aria-busy="true" aria-label="Carregando comparação">
      <div className="grid gap-4 p-5" style={{ gridTemplateColumns: `140px repeat(${colunas}, minmax(0, 1fr))` }}>
        <div />
        {Array.from({ length: colunas }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] animate-pulse rounded-xl bg-slate-200/70" />
            <Barra className="h-5 w-3/4" />
            <Barra className="h-3 w-1/2" />
          </div>
        ))}
        {Array.from({ length: 6 }, (_, linha) => [
          <Barra key={`r${linha}`} className="h-4 w-24" />,
          ...Array.from({ length: colunas }, (_, i) => <Barra key={`c${linha}-${i}`} className="h-4 w-2/3" />),
        ])}
      </div>
    </div>
  );
}

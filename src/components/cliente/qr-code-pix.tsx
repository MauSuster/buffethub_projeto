import { geradorDeterministico } from "@/components/cliente/utilidades";

const TAMANHO = 29;
const MARGEM = 2;

function ehLocalizador(x: number, y: number) {
  const dentro = (ox: number, oy: number) => x >= ox && x < ox + 8 && y >= oy && y < oy + 8;
  return dentro(0, 0) || dentro(TAMANHO - 8, 0) || dentro(0, TAMANHO - 8);
}

function ehCentro(x: number, y: number) {
  const meio = Math.floor(TAMANHO / 2);
  return Math.abs(x - meio) <= 3 && Math.abs(y - meio) <= 3;
}

/** QR Code ILUSTRATIVO (não é lido por apps de banco): só imita o visual de um Pix para o ambiente de testes. */
export function QrCodePix({ semente, className }: { semente: string; className?: string }) {
  const aleatorio = geradorDeterministico(semente);
  let caminho = "";
  for (let y = 0; y < TAMANHO; y++) {
    for (let x = 0; x < TAMANHO; x++) {
      if (ehLocalizador(x, y) || ehCentro(x, y)) continue;
      const temporizador = (x === 6 || y === 6) && (x + y) % 2 === 0;
      if (temporizador || aleatorio() > 0.52) caminho += `M${x + MARGEM} ${y + MARGEM}h1v1h-1z`;
    }
  }
  const total = TAMANHO + MARGEM * 2;
  const localizadores = [
    [MARGEM, MARGEM],
    [MARGEM + TAMANHO - 7, MARGEM],
    [MARGEM, MARGEM + TAMANHO - 7],
  ];
  const meio = MARGEM + Math.floor(TAMANHO / 2);

  return (
    <svg viewBox={`0 0 ${total} ${total}`} className={className} role="img" aria-label="QR Code Pix ilustrativo" shapeRendering="crispEdges">
      <rect width={total} height={total} fill="#fff" />
      <path d={caminho} fill="#0e1c2c" />
      {localizadores.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#0e1c2c" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0e1c2c" />
        </g>
      ))}
      <rect x={meio - 3} y={meio - 3} width={7} height={7} rx={1.5} fill="#fff" />
      <rect x={meio - 2} y={meio - 2} width={5} height={5} rx={1.2} fill="#2f5d8a" />
      <path d={`M${meio - 1} ${meio + 1.2}h3`} stroke="#e8a33d" strokeWidth={0.6} strokeLinecap="round" />
      <path d={`M${meio - 0.9} ${meio + 0.8}a1.4 1.4 0 0 1 2.8 0`} stroke="#fff" strokeWidth={0.45} fill="none" />
    </svg>
  );
}

/** Código de barras ILUSTRATIVO para o boleto fictício. */
export function CodigoBarras({ digitos, className }: { digitos: string; className?: string }) {
  let x = 0;
  const barras: { x: number; w: number }[] = [];
  for (const d of digitos) {
    const n = Number(d);
    barras.push({ x, w: 1 + (n % 3) });
    x += 1 + (n % 3) + 1 + ((n >> 1) % 2);
  }
  return (
    <svg viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" className={className} role="img" aria-label="Código de barras ilustrativo">
      {barras.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} fill="#0e1c2c" />
      ))}
    </svg>
  );
}

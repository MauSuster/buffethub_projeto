import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="BuffetHub, página inicial">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm shadow-brand-900/30">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 18h18" />
          <path d="M5 18a7 7 0 0 1 14 0" />
          <path d="M12 8V6" />
          <circle cx="12" cy="5" r="1" fill="currentColor" />
        </svg>
      </span>
      <span className={cn("text-lg font-extrabold tracking-tight", claro ? "text-white" : "text-slate-900")}>
        Buffet<span className="text-accent-400">Hub</span>
      </span>
    </Link>
  );
}

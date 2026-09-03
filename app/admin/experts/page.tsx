import type { Metadata } from "next";
import Image from "next/image";
import { experts } from "@/lib/experts";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Experts | Admin" };

export default function AdminExpertsPage() {
  return (
    <main className="wrap-wide pb-28">
      <p className="eyebrow">provider directory</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Experts</h1>
      <p className="mt-4 max-w-xl text-ink/65">The current expert catalogue used by matching and booking. Profile editing and therapist accounts are planned next.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((expert) => (
          <article key={expert.id} className="overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift"><div className="flex gap-4 p-5"><Image src={expert.photo} alt={`Portrait of ${expert.name}`} width={96} height={96} className="h-20 w-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><h2 className="font-display text-xl font-medium text-forest-900">{expert.name}</h2><p className="mt-1 text-xs leading-relaxed text-ink/60">{expert.credentials}</p><p className="mt-2 text-sm font-semibold text-forest-800">{formatINR(expert.price)} / session</p></div></div><div className="border-t border-forest-800/10 px-5 py-4"><p className="text-sm text-ink/65">{expert.experience} · {expert.languages.join(" · ")}</p><div className="mt-3 flex flex-wrap gap-1.5">{expert.specialties.map((specialty) => <span key={specialty} className="rounded-full bg-sage-light/70 px-2.5 py-1 text-xs font-medium text-forest-800">{specialty}</span>)}</div></div></article>
        ))}
      </div>
    </main>
  );
}

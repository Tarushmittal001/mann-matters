import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BreathingExercise from "@/components/tools/BreathingExercise";
import { copy } from "@/lib/i18n/copy";
import { helplines } from "@/lib/site";

export const metadata: Metadata = {
  title: "तुरंत मदद — आप अकेले नहीं हैं",
  description:
    "भारत में मानसिक स्वास्थ्य के लिए तुरंत मदद। Tele-MANAS 14416, आपातकाल 112, और भरोसेमंद 24x7 हेल्पलाइन।",
  alternates: {
    canonical: "/hi/crisis",
    languages: { "en-IN": "/crisis", "hi-IN": "/hi/crisis" },
  },
};

/** The 5-4-3-2-1 grounding exercise, in Hindi. */
const grounding = [
  { n: "5", sense: "चीज़ें जो दिख रही हैं", hint: "चारों तरफ़ देखिए और धीरे-धीरे नाम लीजिए।" },
  { n: "4", sense: "चीज़ें जो छू सकते हैं", hint: "ज़मीन पर पैर, कुर्सी, अपनी साँस।" },
  { n: "3", sense: "आवाज़ें जो सुनाई दे रही हैं", hint: "पंखा, बाहर का ट्रैफ़िक, अपनी धड़कन।" },
  { n: "2", sense: "गंध जो महसूस हो रही हैं", hint: "या दो ख़ुशबुएँ जो आपको अच्छी लगती हैं।" },
  { n: "1", sense: "स्वाद", hint: "या पानी का एक धीमा घूँट।" },
];

/**
 * The Hindi crisis page.
 *
 * Same structure as the English one and the same verified numbers, because
 * these are the numbers — not a translation of them. The order is deliberate:
 * the two you dial first, then something to do with your hands while you wait
 * for somebody to pick up, then what to do if the person in trouble is
 * somebody else.
 */
export default function HindiCrisisPage({ searchParams }: { searchParams: { sos?: string } }) {
  const t = copy("hi");
  const sos = searchParams.sos === "true";
  const urgent = helplines.filter((h) => h.primary);
  const rest = helplines.filter((h) => !h.primary);

  return (
    <main className="bg-ivory">
      <section className="page-top border-b border-red-200/60 bg-gradient-to-b from-red-50 to-ivory pb-16">
        <div className="wrap-wide">
          <Reveal>
            {sos && (
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                SOS · {t.crisis.eyebrow}
              </span>
            )}
            <h1 className="h-display max-w-3xl text-4xl text-forest-900 md:text-6xl">
              आप अकेले नहीं हैं। मदद <em className="text-red-600">अभी मौजूद है।</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
              अगर आप खुद को नुकसान पहुँचाने की सोच रहे हैं, या अपनी सुरक्षा को लेकर डर लग रहा है —
              तो इसी वक़्त किसी को फ़ोन कीजिए। {t.crisis.lede}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {urgent.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.dial}`}
                  className="press flex-1 rounded-2xl bg-red-600 px-7 py-6 text-white transition-colors hover:bg-red-700"
                >
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-white/75">
                    {t.crisis.callNow}
                  </p>
                  <p className="mt-1.5 font-display text-4xl font-medium">{h.number}</p>
                  <p className="mt-1.5 text-[0.9rem] text-white/85">{h.name} · {h.hours}</p>
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-8 max-w-xl text-[0.92rem] leading-relaxed text-ink/70">
              {t.crisis.notAlone}
            </p>
          </Reveal>
        </div>
      </section>

      {/* while you wait for someone to pick up */}
      <section className="py-16 md:py-20">
        <div className="wrap-wide grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="h-display text-2xl md:text-3xl">जब तक कोई फ़ोन उठाए</h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink/65">
              साँस के साथ चलिए। इसे ठीक से करने की ज़रूरत नहीं — बस साथ रहिए।
            </p>
            <div className="mt-8">
              <BreathingExercise />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="h-display text-2xl md:text-3xl">5-4-3-2-1</h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink/65">
              जब मन कहीं और भाग रहा हो, यह उसे वापस इस कमरे में ले आता है।
            </p>
            <ol className="mt-8 space-y-4">
              {grounding.map((g) => (
                <li key={g.n} className="flex gap-5 rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
                  <span className="font-display text-3xl font-medium text-gold">{g.n}</span>
                  <div>
                    <p className="font-medium text-forest-900">{g.sense}</p>
                    <p className="mt-0.5 text-[0.88rem] text-ink/70">{g.hint}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* every other line */}
      <section className="bg-sage-light/25 py-16 md:py-20">
        <div className="wrap-wide">
          <Reveal>
            <h2 className="h-display text-2xl md:text-3xl">और हेल्पलाइन</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-ink/65">
              अगर एक नंबर पर बात न हो पाए, तो दूसरे पर कोशिश कीजिए। हार मत मानिए।
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {rest.map((h, i) => (
              <Reveal key={h.number} delay={0.05 * i}>
                <a
                  href={`tel:${h.dial}`}
                  className="card-lift block rounded-2xl border border-forest-800/10 bg-ivory-light p-6"
                >
                  <p className="font-display text-2xl font-medium text-forest-900">{h.number}</p>
                  <p className="mt-1 font-medium text-forest-800">{h.name}</p>
                  <p className="mt-1 text-[0.86rem] text-ink/70">
                    {t.crisis.hours}: {h.hours}
                  </p>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">{h.note}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* if it's somebody else */}
      <section className="py-16 md:py-20">
        <div className="wrap">
          <Reveal>
            <h2 className="h-display text-2xl md:text-3xl">{t.crisis.ifSomeoneElse}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">
              {t.crisis.ifSomeoneElseBody}
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink/65">
              उन्हें अकेला मत छोड़िए। दवाइयाँ और कुछ भी नुकसान पहुँचाने वाली चीज़ हटा दीजिए। और
              उनके साथ बैठकर 14416 मिलाइए — अकेले फ़ोन करने से यह कहीं आसान है।
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href="/hi/book"
                className="press rounded-full bg-gold px-7 py-3.5 font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
              >
                {t.nav.book}
              </Link>
              <Link href="/crisis" className="link-draw font-medium text-forest-800">
                {t.common.readInEnglish}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

import Button from "@/components/ui/Button";

/**
 * Shown instead of the booking flow to an account with no date of birth —
 * one made before we asked for it. The booking API refuses without one,
 * because it decides whether a parent or guardian must agree, so the person is
 * told here, before choosing a time, rather than at the last step.
 */
const COPY = {
  en: {
    eyebrow: "one thing first",
    title: "Add your date of birth",
    body: "We need it before you book. If you are under 18, a parent or guardian has to agree to therapy, and your date of birth is how we know.",
    cta: "Open my profile",
  },
  hi: {
    eyebrow: "पहले एक बात",
    title: "अपनी जन्मतिथि जोड़ें",
    body: "बुक करने से पहले हमें इसकी ज़रूरत है। अगर आपकी उम्र 18 साल से कम है, तो थेरेपी के लिए माता-पिता या अभिभावक की सहमति ज़रूरी है, और यह हम आपकी जन्मतिथि से जानते हैं।",
    cta: "मेरी प्रोफ़ाइल खोलें",
  },
} as const;

export default function DobRequired({ lang = "en" }: { lang?: "en" | "hi" }) {
  const t = COPY[lang];
  return (
    <section className="page-top wrap pb-28">
      <div className="max-w-xl">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="h-display mt-3 text-4xl md:text-5xl">{t.title}</h1>
        <p className="mt-4 leading-relaxed text-ink/70">{t.body}</p>
        <div className="mt-8">
          <Button href="/dashboard/profile" variant="gold">
            {t.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}

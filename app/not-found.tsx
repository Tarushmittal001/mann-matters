import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-24 text-center">
      <p className="font-deva text-5xl text-gold" aria-hidden="true">
        मन
      </p>
      <h1 className="h-display mt-6 text-5xl md:text-6xl">This page wandered off.</h1>
      <p className="mt-5 max-w-md leading-relaxed text-ink/70">
        Minds do that too sometimes. Let&apos;s gently bring you back to somewhere familiar.
      </p>
      <div className="mt-9">
        <Button href="/" variant="gold">
          Back to home
        </Button>
      </div>
    </section>
  );
}

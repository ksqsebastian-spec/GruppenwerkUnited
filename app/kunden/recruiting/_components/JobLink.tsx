export default function JobLink() {
  return (
    <section className="fade-in pb-8">
      <a
        href="https://seehafer-elemente.de/karriere"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border-l-[3px] border-l-orange bg-white p-5 transition-all hover:-translate-y-px hover:shadow-md"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <p className="text-navy text-sm font-bold">
          💼 Offene Stellen ansehen
        </p>
        <p className="text-text-muted mt-1 text-xs">
          Schau dir an, welche Positionen gerade gesucht werden
        </p>
        <p className="text-orange mt-1 text-xs font-semibold">
          seehafer-elemente.de/karriere →
        </p>
      </a>
    </section>
  );
}

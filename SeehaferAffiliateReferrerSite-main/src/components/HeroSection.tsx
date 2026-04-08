export default function HeroSection() {
  return (
    <section className="fade-in pb-6 text-center">
      <h1
        className="text-navy font-extrabold"
        style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15 }}
      >
        Empfiehl uns weiter.
        <br />
        <span className="text-orange">Verdiene mit.</span>
      </h1>
      <p className="text-text-muted mx-auto mt-4 max-w-[360px]">
        Jemand aus deinem Umfeld braucht Tischlerarbeiten? Sag Bescheid — und
        verdiene eine Provision, wenn ein Auftrag zustande kommt.
      </p>
    </section>
  );
}

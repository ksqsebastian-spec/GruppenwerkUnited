export default function HeroSection() {
  return (
    <section className="fade-in pb-6 text-center">
      <h1
        className="text-navy font-extrabold"
        style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15 }}
      >
        Kennst du jemanden, der richtig gut ist?
        <br />
        <span className="text-orange">
          Sag Bescheid — und verdien 1.000 €.
        </span>
      </h1>
      <p className="text-text-muted mx-auto mt-4 max-w-[380px]">
        Du kennst jemanden, der als Tischler, Monteur oder Helfer richtig gut
        wäre? Empfiehl die Person an uns weiter — wenn sie eingestellt wird und
        die Probezeit besteht, zahlen wir dir 1.000 € Prämie.
      </p>
    </section>
  );
}

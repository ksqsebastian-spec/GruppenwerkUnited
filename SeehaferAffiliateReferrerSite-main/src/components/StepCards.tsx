const steps = [
  {
    num: 1,
    title: "Formular ausfullen",
    desc: "Name und PayPal-Adresse (oder Bankverbindung) eingeben.",
    highlight: false,
  },
  {
    num: 2,
    title: "Empfehlungsblock weitergeben",
    desc: "Per E-Mail, Gmail, Zwischenablage oder PDF — an die Person, die Tischlerarbeiten braucht.",
    highlight: false,
  },
  {
    num: 3,
    title: "Auftrag kommt zustande",
    desc: "Die Person schickt eine Anfrage an Seehafer Elemente und fugt den Empfehlungsblock bei.",
    highlight: false,
  },
  {
    num: 4,
    title: "Provision erhalten",
    desc: "Wenn ein Auftrag daraus entsteht, bekommst du deine Provision auf PayPal oder per Uberweisung.",
    highlight: true,
  },
];

export default function StepCards() {
  return (
    <section className="fade-in pb-10">
      <p className="text-navy mb-5 text-center text-sm font-bold tracking-wide uppercase">
        So funktioniert es
      </p>
      <div className="relative ml-6 border-l-2 border-gray-200 pl-8 sm:ml-8 sm:pl-10">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`relative pb-8 ${i === steps.length - 1 ? "pb-0" : ""}`}
          >
            {/* Circle on the timeline */}
            <span
              className={`absolute -left-[calc(2rem+1px)] flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white sm:-left-[calc(2.5rem+1px)] sm:h-12 sm:w-12 sm:text-base ${
                step.highlight ? "bg-orange ring-4 ring-orange-100" : "bg-navy"
              }`}
            >
              {step.num}
            </span>

            {/* Content */}
            <div
              className={`rounded-xl p-4 sm:p-5 ${
                step.highlight
                  ? "bg-orange-50 ring-1 ring-orange-200"
                  : "bg-white"
              }`}
              style={
                step.highlight
                  ? undefined
                  : { boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
              }
            >
              <p
                className={`text-sm font-bold sm:text-base ${
                  step.highlight ? "text-orange" : "text-navy"
                }`}
              >
                {step.title}
              </p>
              <p className="text-text-muted mt-1 text-xs sm:text-sm">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

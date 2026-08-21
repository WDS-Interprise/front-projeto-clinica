import { LANDING_TRUST_CLINICS } from "@/lib/landing-content"

export default function LandingMarquee() {
  const items = [...LANDING_TRUST_CLINICS, ...LANDING_TRUST_CLINICS]

  return (
    <section aria-label="Clínicas e consultórios que já confiam na ClinMax" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#f3f5f8] px-5 py-8 sm:px-8 sm:py-10">
        <h2 className="text-center font-landing-heading text-lg font-bold tracking-tight text-[#0A1F44] sm:text-xl">
          Clínicas e consultórios que já confiam na ClinMax
        </h2>

        <div className="landing-logo-loop mt-7 sm:mt-8" aria-hidden={false}>
          <ul className="landing-logo-track">
            {items.map(({ icon: Icon, name }, index) => (
              <li key={`${name}-${index}`} className="landing-logo-item">
                <Icon strokeWidth={1.75} aria-hidden />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const QUESTIONS = [
  {
    title: "Where can I stay with Bunks?",
    answer:
      "Explore our growing collection of homes, starting in Summerland, California, and Steamboat Springs, Colorado. Each listing has photographs, sleeping arrangements, amenities, and availability.",
  },
  {
    title: "Why book directly?",
    answer:
      "Bunks helps you return to homes you love and book directly with your host for 10% less than the same listing on other booking platforms. Choose your dates to see the itemized price for your stay.",
  },
  {
    title: "How do I check availability?",
    answer:
      "Open a home and choose your check-in and check-out dates. You can set your guest count and review the price before continuing to your booking details.",
  },
  {
    title: "Where do I find an existing booking?",
    answer:
      "Open My trips and enter your booking reference and the email you used to book. Your trip brings together the essential information, home guide, and messages for your stay.",
  },
];

export function StayFaq() {
  return (
    <section className="marketing-section bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="marketing-title mb-10 text-center text-4xl sm:text-5xl">
          A few things to know.
        </h2>
        <div className="divide-y border-y">
          {QUESTIONS.map(({ title, answer }) => (
            <details key={title} className="group py-6">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {title}
                <span
                  className="text-2xl font-normal transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[65ch] pt-4 text-base leading-relaxed text-gray-600">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

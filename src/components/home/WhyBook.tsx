import Link from "next/link";
import { Coffee, KeyRound, House } from "lucide-react";

const FEATURES = [
  {
    icon: KeyRound,
    title: "Your home, for a little while",
    description:
      "Room to gather, a kitchen to cook in, and the freedom to make the day your own.",
    color: "text-[#9c731b]",
    background: "bg-[#fae8aa]",
  },
  {
    icon: House,
    title: "Book with the people who know it",
    description:
      "A direct connection to your hosts, from your first question to your last morning.",
    color: "text-[#477993]",
    background: "bg-[#d7eaf0]",
  },
  {
    icon: Coffee,
    title: "The details, taken care of",
    description:
      "Professionally prepared homes, local recommendations, and support throughout your stay.",
    color: "text-[#536f55]",
    background: "bg-[#dfe9d9]",
  },
];

export function WhyBook({ showAboutLink = true }: { showAboutLink?: boolean }) {
  return (
    <section className="marketing-section bg-white">
      <div className="marketing-container">
        <h2 className="marketing-title mx-auto max-w-3xl text-center text-3xl sm:text-[42px]">
          A more personal way to get away.
          <br className="hidden sm:block" /> A home, and the people behind it.
        </h2>
        <div className="mb-12 mt-12 grid gap-12 md:mb-16 md:mt-20 md:grid-cols-3 lg:gap-16">
          {FEATURES.map(
            ({ icon: Icon, title, description, color, background }) => (
              <div key={title} className="mx-auto max-w-sm text-center">
                <div
                  className={`relative mx-auto mb-7 flex h-20 w-20 items-center justify-center ${color}`}
                >
                  <span
                    className={`absolute inset-2 rotate-[-12deg] rounded-[35%_55%_40%_60%] ${background}`}
                  />
                  <Icon
                    className="relative h-12 w-12"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mb-3 text-base font-semibold tracking-normal">
                  {title}
                </h3>
                <p className="text-base leading-relaxed text-gray-500 sm:text-lg">
                  {description}
                </p>
              </div>
            ),
          )}
        </div>
        {showAboutLink && (
          <div className="text-center">
            <Link href="/?view=about" className="marketing-button">
              Meet Bunks
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

export function ExperienceBanner() {
  return (
    <div className="marketing-container space-y-20 pb-20 sm:space-y-28 sm:pb-28">
      <section className="grid overflow-hidden rounded-lg bg-[#eeece8] md:grid-cols-2">
        <div className="flex flex-col items-start justify-center px-7 py-12 sm:p-12 lg:p-16">
          <p className="mb-6 text-sm font-semibold uppercase tracking-wide">
            Book direct
          </p>
          <h2 className="marketing-title mb-6 text-4xl lg:text-5xl">
            The same lovely home.
            <br />A little more left
            <br className="hidden lg:block" /> for the trip.
          </h2>
          <p className="mb-8 max-w-md text-lg leading-relaxed">
            Book your next stay directly with your host and save 10% compared to
            the same home on other booking platforms. Familiar places, personal
            connections, and more left for your trip.
          </p>
          <Link href="/#listings" className="marketing-button">
            Find your next stay
          </Link>
        </div>
        <div className="relative min-h-[330px] md:min-h-[580px]">
          <Image
            src="/summerland/living-room/living-room-4.webp"
            alt="Light-filled seating and natural textures in the Summerland living room"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>
      <section className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <div className="relative min-h-[380px] overflow-hidden rounded-lg sm:min-h-[560px] lg:min-h-[650px]">
          <Image
            src="/steamboat-pictures/exterior/exterior-4.jpg"
            alt="The timber and stone exterior of our Steamboat townhome"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="py-4 lg:px-6">
          <p className="mb-6 text-sm font-semibold uppercase tracking-wide">
            A warm welcome
          </p>
          <h2 className="marketing-title mb-9 text-4xl lg:text-5xl">
            Settle in.
            <br />
            We’ll take it from here.
          </h2>
          <ul className="mb-9 divide-y divide-gray-200">
            {[
              "Homes professionally cleaned and prepared for your arrival",
              "Clear arrival details, all in one place",
              "Local favorites to help you find your feet",
              "A direct line to your hosts during your stay",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 py-5 text-base leading-relaxed lg:text-lg"
              >
                <Check
                  className="mt-1 h-5 w-5 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/?view=about" className="marketing-button">
            A little about us
          </Link>
        </div>
      </section>
    </div>
  );
}

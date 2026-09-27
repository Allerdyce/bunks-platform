import Image from "next/image";
import { PROPERTY_REVIEWS } from "@/data/reviews";

const stories = [
  PROPERTY_REVIEWS["summerland-ocean-view-beach-bungalow"][0],
  PROPERTY_REVIEWS["steamboat-downtown-townhome"][1],
];

export function GuestStories() {
  return (
    <section className="marketing-section bg-[#f7f6f3]">
      <div className="marketing-container">
        <h2 className="marketing-title mx-auto mb-12 max-w-2xl text-center text-4xl sm:text-5xl">
          Good places become
          <br />
          great memories.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <figure className="flex min-h-[380px] flex-col justify-between rounded-lg bg-[#b5ced9] p-7 lg:p-9">
            <blockquote className="text-lg font-medium leading-relaxed">
              “{stories[0].body}”
            </blockquote>
            <figcaption className="mt-10 text-sm">
              <span className="font-semibold">{stories[0].guestName}</span>
              <br />
              Summerland · {stories[0].stayDate}
            </figcaption>
          </figure>
          <div className="relative min-h-[380px] overflow-hidden rounded-lg">
            <Image
              src="/2211-lillie-ave/exterior/exterior-1.webp"
              alt="An outdoor lounge for unhurried days on the California coast"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <span className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-sm">
              A little more time together.
            </span>
          </div>
          <figure className="flex min-h-[380px] flex-col justify-between rounded-lg bg-[#c6d8bf] p-7 lg:p-9">
            <blockquote className="text-lg font-medium leading-relaxed">
              “{stories[1].body}”
            </blockquote>
            <figcaption className="mt-10 text-sm">
              <span className="font-semibold">{stories[1].guestName}</span>
              <br />
              Steamboat Springs · {stories[1].stayDate}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

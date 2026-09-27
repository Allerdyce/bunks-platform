import Image from "next/image";

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
          <div className="flex min-h-[380px] flex-col justify-between rounded-lg bg-[#b5ced9] p-7 lg:p-9">
            <h3 className="text-lg font-medium leading-relaxed">
              Slow mornings. Salt air. A little room to unwind.
            </h3>
            <p className="mt-10 text-sm">
              Coffee on the deck, a walk by the ocean, and time together. Make
              yourself at home in Summerland.
            </p>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-lg">
            <Image
              src="/summerland/exterior/exterior-1.webp"
              alt="An outdoor lounge for unhurried days on the California coast"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <span className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-sm">
              A little more time together.
            </span>
          </div>
          <div className="flex min-h-[380px] flex-col justify-between rounded-lg bg-[#c6d8bf] p-7 lg:p-9">
            <h3 className="text-lg font-medium leading-relaxed">
              Fresh mountain air. A place to gather after a day outside.
            </h3>
            <p className="mt-10 text-sm">
              Find your own pace in Steamboat Springs, from snowy weekends to
              long summer days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

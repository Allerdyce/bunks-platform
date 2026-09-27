import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <Link
      href={`/property/${property.slug}`}
      onClick={(event) => {
        if (
          onClick &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          onClick();
        }
      }}
      className="group flex h-full flex-col text-left"
    >
      <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={property.image}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium">
          Book direct · Save 10%
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{property.location}</p>
        <span className="flex shrink-0 items-center gap-1 text-sm">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          {property.rating}
        </span>
      </div>
      <h3 className="mb-3 font-serif text-2xl font-normal sm:text-3xl">
        {property.name}
      </h3>
      <p className="text-sm text-gray-500">
        {property.guests} guests <span aria-hidden="true">·</span>{" "}
        {property.bedrooms} bedrooms <span aria-hidden="true">·</span>{" "}
        {property.bathrooms} baths
      </p>
      <div className="mt-5 flex items-center justify-between border-t py-4 text-sm">
        <span className="text-gray-500">A place to make your own</span>
        <span className="flex items-center gap-2 font-medium">
          Explore home{" "}
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:trangray-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

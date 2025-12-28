import Link from "next/link";
import Image from "next/image";
import { Bath, Bed, MapPin, Star, Users } from "lucide-react";
import type { Property } from "@/types";

const nightlyRateFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <Link
      href={`/property/${property.slug}`}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={property.image}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 fill-current text-gray-900" />
          {property.rating}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-serif text-xl text-gray-900 leading-tight mb-1 group-hover:text-gray-700 transition-colors">
              {property.name}
            </h3>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {property.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-500 text-sm my-4 border-t border-gray-50 pt-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {property.guests} Guests
          </span>
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {property.bedrooms} Bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {property.bathrooms} Ba
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg font-semibold text-gray-900">
              Save 10% on all stays
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 group-hover:decoration-gray-900 transition-all">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}

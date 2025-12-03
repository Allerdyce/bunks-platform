"use client";

import type { Property } from "@/types";
import { PropertyCard } from "@/components/properties/PropertyCard";

interface PropertyGridProps {
  properties: Property[];
  onSelect: (property: Property) => void;
}

export function PropertyGrid({ properties, onSelect }: PropertyGridProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} onClick={() => onSelect(property)} />
      ))}
    </div>
  );
}

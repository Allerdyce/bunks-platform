import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";

export default function PropertyPage() {
  return (
    <Suspense fallback={null}>
      <BunksApp />
    </Suspense>
  );
}

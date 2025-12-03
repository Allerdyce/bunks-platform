import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BunksApp />
    </Suspense>
  );
}

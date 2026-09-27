import Link from "next/link";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";

export default function NotFound() {
  return (
    <StandaloneLayout>
      <section className="marketing-section px-6 text-center">
        <p className="mb-5 text-sm font-semibold">
          404 · A little off the beaten path
        </p>
        <h1 className="page-title mb-6">Let’s get you back home.</h1>
        <p className="mx-auto mb-8 max-w-md text-lg leading-relaxed text-gray-600">
          We couldn’t find that page. Explore the homes or pick up where you
          left off.
        </p>
        <Link href="/" className="marketing-button">
          Back to Bunks
        </Link>
      </section>
    </StandaloneLayout>
  );
}

"use client";

import { useState } from "react";
import { SUPPORT_EMAIL } from "@/lib/contact";

type Status = { type: "idle" } | { type: "sending" } | { type: "sent" } | { type: "error"; message: string };

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-gray-900 focus:outline-none";

export function HomeHubRequestForm() {
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setStatus({ type: "sending" });
    try {
      const res = await fetch("/api/owner-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, properties: data.properties || undefined }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
      setStatus({ type: "sent" });
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    }
  };

  if (status.type === "sent") {
    return (
      <div role="status" className="space-y-3">
        <h3 className="section-heading text-gray-900">Thanks, we&apos;ve got it.</h3>
        <p className="text-gray-600">
          We&apos;ll email you shortly about your Home Hub. Questions in the meantime? Write to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="owner-name" className="text-sm font-medium text-gray-700">
          Your name
        </label>
        <input id="owner-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="owner-email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="owner-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="owner-location" className="text-sm font-medium text-gray-700">
          Where is your property?
        </label>
        <input
          id="owner-location"
          name="location"
          required
          maxLength={200}
          placeholder="e.g. Steamboat Springs, CO"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div>
          <label htmlFor="owner-properties" className="text-sm font-medium text-gray-700">
            How many?
          </label>
          <input
            id="owner-properties"
            name="properties"
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            placeholder="1"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="owner-listing" className="text-sm font-medium text-gray-700">
            Listing link <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="owner-listing"
            name="listingUrl"
            type="url"
            maxLength={500}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="owner-message" className="text-sm font-medium text-gray-700">
          Anything else? <span className="text-gray-400">(optional)</span>
        </label>
        <textarea id="owner-message" name="message" rows={3} maxLength={2000} className={inputClass} />
      </div>
      {status.type === "error" && (
        <p role="alert" className="text-sm text-red-700">
          {status.message}
        </p>
      )}
      <button type="submit" disabled={status.type === "sending"} className="marketing-button w-full disabled:opacity-60">
        {status.type === "sending" ? "Sending…" : "Request my free Home Hub"}
      </button>
      <p className="text-xs text-gray-500">We&apos;ll only use your details to set up your Home Hub.</p>
    </form>
  );
}

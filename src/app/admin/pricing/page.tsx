"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Lock, LogOut, RefreshCw } from "lucide-react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { PropertyCard } from "@/components/admin/PropertyCard";
import type { AdminFeatureToggle, AdminProperty } from "@/types";

export default function AdminPricingPage() {
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [featureFlags, setFeatureFlags] = useState<AdminFeatureToggle[]>([]);
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [error, setError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingFeatureKey, setUpdatingFeatureKey] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        if (res.ok) {
          setAuthState("authenticated");
          await Promise.all([fetchProperties(), fetchFeatureFlags()]);
        } else {
          setAuthState("unauthenticated");
        }
      } catch (err) {
        console.error("Failed to check admin session", err);
        setAuthState("unauthenticated");
      }
    };
    bootstrap();
  }, []);

  const fetchProperties = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/properties", { credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = (payload as { error?: string }).error;
        throw new Error(message ?? `Failed to load properties (status ${res.status})`);
      }
      const data = (await res.json()) as { properties: AdminProperty[] };
      setProperties(data.properties);
    } catch (err) {
      console.error(err);
      setError((err as Error).message ?? "Failed to load properties");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch("/api/admin/features", { credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = (payload as { error?: string }).error;
        throw new Error(message ?? `Failed to load feature toggles (status ${res.status})`);
      }
      const data = (await res.json()) as { features: AdminFeatureToggle[] };
      setFeatureFlags(data.features ?? []);
      setFeatureError(null);
    } catch (err) {
      console.error(err);
      setFeatureError((err as Error).message ?? "Failed to load feature toggles");
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
      await Promise.all([fetchProperties(), fetchFeatureFlags()]);
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
    setProperties([]);
  };

  const handleRatesSave = async (
    propertyId: number,
    payload: { weekdayRate: number; weekendRate: number; cleaningFee: number; serviceFee: number },
  ) => {
    setError(null);
    const res = await fetch(`/api/admin/properties/${propertyId}/rates`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save rates");
    }
    await fetchProperties();
  };

  const handleSpecialSave = async (
    propertyId: number,
    payload: { startDate: string; endDate?: string; price?: number; note?: string; isBlocked?: boolean },
  ) => {
    setError(null);
    const res = await fetch(`/api/admin/properties/${propertyId}/special-pricing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save special rate");
    }
    await fetchProperties();
  };

  const handleFeatureToggle = async (feature: AdminFeatureToggle) => {
    setFeatureError(null);
    setUpdatingFeatureKey(feature.key);
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: feature.key, enabled: !feature.enabled }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update feature toggle");
      }

      const data = (await res.json()) as { features: AdminFeatureToggle[] };
      setFeatureFlags(data.features ?? []);
    } catch (err) {
      console.error(err);
      setFeatureError((err as Error).message ?? "Failed to update feature toggle");
    } finally {
      setUpdatingFeatureKey(null);
    }
  };

  const handleSpecialDelete = async (propertyId: number, specialIds: number | number[]) => {
    setError(null);
    const ids = Array.isArray(specialIds) ? specialIds : [specialIds];

    for (const specialId of ids) {
      const res = await fetch(`/api/admin/properties/${propertyId}/special-pricing/${specialId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete special rate");
      }
    }

    await fetchProperties();
  };

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900">Admin Console</h1>
            <p className="text-sm text-slate-500">Restricted area for rate management.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminTopNav
        active="pricing"
        actions={
          <>
            <button
              onClick={fetchProperties}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        }
      />

      <main className="w-full px-6 lg:px-12 mt-8">
        {error && (
          <div className="mb-8 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {featureError && (
          <div className="mb-8 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {featureError}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT COL: Header & Context */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bunks Ops</p>
              <h1 className="text-2xl font-serif text-slate-900 mt-1">Rate & Availability Console</h1>
              <p className="text-sm text-slate-500">Adjust weekday/weekend rates, cleaning & service fees, plus date-specific overrides.</p>
            </div>

            {featureFlags.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="font-serif text-lg text-slate-900">Feature toggles</h2>
                  <p className="text-sm text-slate-500">Quickly enable or pause marketplace experiments.</p>
                </div>
                <div className="space-y-4">
                  {featureFlags.map((feature) => {
                    const isLoading = updatingFeatureKey === feature.key;
                    return (
                      <div
                        key={feature.key}
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{feature.label}</p>
                            <span
                              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${feature.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}
                            >
                              {feature.enabled ? "Live" : "Off"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleFeatureToggle(feature)}
                            disabled={isLoading}
                            className={`shrink-0 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${feature.enabled
                              ? "border-slate-200 text-slate-600 hover:border-slate-400"
                              : "border-violet-200 text-violet-700 hover:border-violet-400"
                              } ${isLoading ? "opacity-50" : ""}`}
                          >
                            {isLoading ? "..." : feature.enabled ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COL: Property Cards */}
          <div className="lg:col-span-8 space-y-8">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onSaveRates={handleRatesSave}
                onSaveSpecial={handleSpecialSave}
                onDeleteSpecial={handleSpecialDelete}
              />
            ))}
            {!properties.length && !refreshing && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                No properties in the database. Run the Prisma seed or add listings to begin.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

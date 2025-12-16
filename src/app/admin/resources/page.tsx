"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, ClipboardList, ExternalLink, Loader2, Lock, LogOut, RefreshCw } from "lucide-react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

import { CLEANING_PROFILES } from "@/lib/cleaning/data";
import { ChecklistProfile, ChecklistSection, ChecklistSubsection } from "@/types/cleaning";

const STORAGE_KEY = "admin-cleaning-profiles";

const buildProfileMap = (profiles: ChecklistProfile[]) =>
  profiles.reduce<Record<string, ChecklistProfile>>((acc, profile) => {
    acc[profile.slug] = profile;
    return acc;
  }, {});

const PROFILE_ORDER = CLEANING_PROFILES.map((profile) => profile.slug);

const duplicateProfile = (profile: ChecklistProfile) => JSON.parse(JSON.stringify(profile)) as ChecklistProfile;

const listToLines = (items?: string[]) => (items ?? []).join("\n");

const linesToList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const createEmptySection = (): ChecklistSection => ({
  title: "New section",
  badge: "ℹ️",
  description: "",
  items: [],
  subsections: [],
});

const createEmptySubsection = (): ChecklistSubsection => ({
  title: "New subsection",
  items: [],
});

const sanitizeProfile = (profile: ChecklistProfile): ChecklistProfile => ({
  ...profile,
  chips: profile.chips?.filter((chip) => chip.trim().length > 0) ?? [],
  sections: profile.sections.map((section) => ({
    ...section,
    badge: section.badge?.trim()?.length ? section.badge : undefined,
    description: section.description?.trim()?.length ? section.description : undefined,
    items: section.items?.filter((item) => item.trim().length > 0) ?? [],
    footer: section.footer?.trim()?.length ? section.footer : undefined,
    subsections:
      section.subsections?.map((subsection) => ({
        ...subsection,
        items: subsection.items?.filter((item) => item.trim().length > 0) ?? [],
      })) ?? [],
  })),
});

const SUPPLY_LINKS = [
  {
    label: "Mountain Escape Toiletries",
    description: "Rental-ready amenity kit (shampoo, conditioner, body wash, lotion, soaps)",
    href: "https://www.amazon.com/Mountain-Escape-Toiletries-Conditioner-Amenities/dp/B0DVC7MRSD",
  },
];

export default function AdminResourcesPage() {
  const [profiles, setProfiles] = useState<Record<string, ChecklistProfile>>(() => buildProfileMap(CLEANING_PROFILES));
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [email, setEmail] = useState("ali@bunks.com");
  const [password, setPassword] = useState("PMbunks101!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileSlug, setSelectedProfileSlug] = useState(() => PROFILE_ORDER[0] ?? "");
  const profile = profiles[selectedProfileSlug];
  const [isEditing, setIsEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ChecklistProfile | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const profileOptions = useMemo(
    () => PROFILE_ORDER.map((slug) => profiles[slug]).filter(Boolean) as ChecklistProfile[],
    [profiles],
  );

  const persistProfiles = (nextProfiles: Record<string, ChecklistProfile>) => {
    setProfiles(nextProfiles);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(nextProfiles)));
    } catch (storageError) {
      console.error("Failed to persist checklists", storageError);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        setAuthState("authenticated");
      } catch (err) {
        console.error("Failed to bootstrap admin session", err);
        setAuthState("unauthenticated");
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as ChecklistProfile[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const restored = buildProfileMap(parsed);
      setProfiles((prev) => ({ ...prev, ...restored }));
    } catch (storageError) {
      console.error("Failed to restore saved checklists", storageError);
    }
  }, []);

  useEffect(() => {
    if (!profile) {
      setProfileDraft(null);
      return;
    }
    setProfileDraft(duplicateProfile(profile));
    setDraftError(null);
    setSaveState("idle");
  }, [profile]);

  const handleProfileSave = () => {
    if (!profileDraft) return;
    setDraftError(null);
    setSaveState("saving");
    try {
      if (profileDraft.slug !== profile?.slug) {
        throw new Error(`The slug must remain "${profile?.slug}" to keep links aligned.`);
      }
      const sanitized = sanitizeProfile(profileDraft);
      const updatedProfiles = { ...profiles, [sanitized.slug]: sanitized };
      persistProfiles(updatedProfiles);
      setSaveState("saved");
      setIsEditing(false);
      setLastSavedAt(new Date().toISOString());
    } catch (saveError) {
      console.error("Failed to save checklist", saveError);
      setDraftError(saveError instanceof Error ? saveError.message : "Unable to save checklist.");
      setSaveState("error");
    }
  };

  const handleProfileReset = () => {
    const original = CLEANING_PROFILES.find((item) => item.slug === selectedProfileSlug);
    if (!original) return;
    const updatedProfiles = { ...profiles, [original.slug]: original };
    persistProfiles(updatedProfiles);
    setProfileDraft(duplicateProfile(original));
    setDraftError(null);
    setSaveState("idle");
    setIsEditing(false);
  };

  const updateProfileDraft = (updater: (draft: ChecklistProfile) => ChecklistProfile) => {
    setProfileDraft((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      return { ...next };
    });
  };

  const handleSectionChange = (sectionIndex: number, changes: Partial<ChecklistSection>) => {
    updateProfileDraft((draft) => {
      const sections = [...draft.sections];
      sections[sectionIndex] = { ...sections[sectionIndex], ...changes } as ChecklistSection;
      return { ...draft, sections };
    });
  };

  const handleSectionItemsChange = (sectionIndex: number, value: string) => {
    handleSectionChange(sectionIndex, { items: linesToList(value) });
  };

  const handleSectionSubsectionItemsChange = (
    sectionIndex: number,
    subsectionIndex: number,
    value: string,
  ) => {
    updateProfileDraft((draft) => {
      const sections = [...draft.sections];
      const subsections = [...(sections[sectionIndex].subsections ?? [])];
      subsections[subsectionIndex] = {
        ...subsections[subsectionIndex],
        items: linesToList(value),
      };
      sections[sectionIndex] = { ...sections[sectionIndex], subsections };
      return { ...draft, sections };
    });
  };

  const handleSubsectionTitleChange = (sectionIndex: number, subsectionIndex: number, value: string) => {
    updateProfileDraft((draft) => {
      const sections = [...draft.sections];
      const subsections = [...(sections[sectionIndex].subsections ?? [])];
      subsections[subsectionIndex] = { ...subsections[subsectionIndex], title: value };
      sections[sectionIndex] = { ...sections[sectionIndex], subsections };
      return { ...draft, sections };
    });
  };

  const handleAddSection = () => {
    updateProfileDraft((draft) => ({ ...draft, sections: [...draft.sections, createEmptySection()] }));
  };

  const handleRemoveSection = (sectionIndex: number) => {
    updateProfileDraft((draft) => ({
      ...draft,
      sections: draft.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  const handleAddSubsection = (sectionIndex: number) => {
    updateProfileDraft((draft) => {
      const sections = [...draft.sections];
      const subsections = [...(sections[sectionIndex].subsections ?? [])];
      subsections.push(createEmptySubsection());
      sections[sectionIndex] = { ...sections[sectionIndex], subsections };
      return { ...draft, sections };
    });
  };

  const handleRemoveSubsection = (sectionIndex: number, subsectionIndex: number) => {
    updateProfileDraft((draft) => {
      const sections = [...draft.sections];
      const subsections = (sections[sectionIndex].subsections ?? []).filter((_, index) => index !== subsectionIndex);
      sections[sectionIndex] = { ...sections[sectionIndex], subsections };
      return { ...draft, sections };
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Invalid credentials");
      }
      setAuthState("authenticated");
    } catch (err) {
      setAuthState("unauthenticated");
      setError((err as Error)?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthState("unauthenticated");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      if (!res.ok) {
        setAuthState("unauthenticated");
      }
    } catch (err) {
      console.error("Failed to refresh session", err);
      setAuthState("unauthenticated");
    } finally {
      setRefreshing(false);
    }
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
            <p className="text-sm text-slate-500">Restricted ops content.</p>
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
        active="resources"
        actions={
          <>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh session
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

      <main className="w-full px-6 lg:px-12 mt-8 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bunks Ops</p>
          <h1 className="text-2xl font-serif text-slate-900 mt-1">Ops resource library</h1>
          <p className="text-sm text-slate-500">Printable checklists, supply links, and quick references for on-the-ground teams.</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Property checklist</p>
                <p className="mt-1 text-sm text-slate-600">Switch between Properties.</p>
                {lastSavedAt && (
                  <p className="mt-2 text-xs text-slate-400">Locally saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                )}
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    id="property-select"
                    value={selectedProfileSlug}
                    onChange={(event) => {
                      setSelectedProfileSlug(event.target.value);
                      setIsEditing(false);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                  >
                    {profileOptions.map((option) => (
                      <option value={option.slug} key={option.slug}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing && profile) {
                      setProfileDraft(duplicateProfile(profile));
                    }
                    setIsEditing((prev) => !prev);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-violet-400 hover:text-violet-700 transition"
                >
                  {isEditing ? "Close editor" : "Edit checklist"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="relative aspect-video w-full">
                <Image
                  src={profile?.heroImage ?? "/steamboat-pictures/steamboat-cleaning.png"}
                  alt={profile?.heroAlt ?? "Cleaning setup"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{profile?.locationLabel}</p>
                <h2 className="text-3xl font-serif text-slate-900">{profile?.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{profile?.summary}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {profile?.chips?.map((chip) => (
                    <span key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
                      <ClipboardList className="w-3 h-3" /> {chip}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-8">
            {isEditing && profileDraft && (
              <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">Editing {profileDraft.title}</p>
                  <p className="text-xs text-slate-500">Update the fields below. Changes stay in this browser until you save.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Display name</label>
                    <input
                      type="text"
                      value={profileDraft.title}
                      onChange={(event) => updateProfileDraft((draft) => ({ ...draft, title: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Location label</label>
                    <input
                      type="text"
                      value={profileDraft.locationLabel}
                      onChange={(event) => updateProfileDraft((draft) => ({ ...draft, locationLabel: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hero image path</label>
                    <input
                      type="text"
                      value={profileDraft.heroImage}
                      onChange={(event) => updateProfileDraft((draft) => ({ ...draft, heroImage: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hero image alt text</label>
                    <input
                      type="text"
                      value={profileDraft.heroAlt}
                      onChange={(event) => updateProfileDraft((draft) => ({ ...draft, heroAlt: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Summary paragraph</label>
                  <textarea
                    value={profileDraft.summary}
                    onChange={(event) => updateProfileDraft((draft) => ({ ...draft, summary: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hero chips (one per line)</label>
                  <textarea
                    value={listToLines(profileDraft.chips)}
                    onChange={(event) => updateProfileDraft((draft) => ({ ...draft, chips: linesToList(event.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Checklist sections</p>
                      <p className="text-xs text-slate-500">Edit each card’s content using the text boxes below.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-violet-400"
                    >
                      + Add section
                    </button>
                  </div>

                  <div className="space-y-4">
                    {profileDraft.sections.map((section, sectionIndex) => (
                      <div key={`${section.title}-${sectionIndex}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Section {sectionIndex + 1}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sectionIndex)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove section
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Title</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(event) => handleSectionChange(sectionIndex, { title: event.target.value })}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Badge / emoji</label>
                            <input
                              type="text"
                              value={section.badge ?? ""}
                              onChange={(event) => handleSectionChange(sectionIndex, { badge: event.target.value })}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600">Description (optional)</label>
                          <textarea
                            value={section.description ?? ""}
                            onChange={(event) => handleSectionChange(sectionIndex, { description: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600">List items (one per line)</label>
                          <textarea
                            value={listToLines(section.items)}
                            onChange={(event) => handleSectionItemsChange(sectionIndex, event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600">Footer (optional)</label>
                          <textarea
                            value={section.footer ?? ""}
                            onChange={(event) => handleSectionChange(sectionIndex, { footer: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-600">Subsections</p>
                            <button
                              type="button"
                              onClick={() => handleAddSubsection(sectionIndex)}
                              className="text-xs font-medium text-slate-700 hover:underline"
                            >
                              + Add subsection
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(section.subsections ?? []).map((subsection, subsectionIndex) => (
                              <div key={`${subsection.title}-${subsectionIndex}`} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <label className="text-xs font-semibold text-slate-600">Subsection {subsectionIndex + 1} title</label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubsection(sectionIndex, subsectionIndex)}
                                    className="text-[11px] font-medium text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={subsection.title}
                                  onChange={(event) => handleSubsectionTitleChange(sectionIndex, subsectionIndex, event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                                />
                                <div className="space-y-2">
                                  <label className="text-[11px] font-semibold text-slate-500">Items (one per line)</label>
                                  <textarea
                                    value={listToLines(subsection.items)}
                                    onChange={(event) => handleSectionSubsectionItemsChange(sectionIndex, subsectionIndex, event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {draftError && <p className="text-sm text-red-600">{draftError}</p>}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleProfileReset}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-300"
                  >
                    Reset to default
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={saveState === "saving"}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save checklist"}
                  </button>
                </div>
              </section>
            )}

            <section className="space-y-6">
              {profile?.sections?.map((section) => (
                <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    {section.badge && (
                      <span className="text-2xl" aria-hidden="true">
                        {section.badge}
                      </span>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                      {section.description && <p className="text-sm text-slate-500">{section.description}</p>}
                    </div>
                  </div>
                  {section.items && (
                    <ul className="mt-4 space-y-2 text-slate-700">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-1 block h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.subsections && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {section.subsections.map((subsection) => (
                        <div key={`${section.title}-${subsection.title}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{subsection.title}</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-700">
                            {subsection.items.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.footer && <p className="mt-4 text-sm font-semibold text-slate-600">{section.footer}</p>}
                </article>
              ))}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Supply list</p>
                  <h3 className="text-2xl font-serif text-slate-900">Restock-ready links</h3>
                  <p className="text-sm text-slate-500">
                    Share these direct-order kits with local teams to keep baskets full week after week.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {SUPPLY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-violet-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{link.label}</p>
                        <p className="text-sm text-slate-600">{link.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-violet-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

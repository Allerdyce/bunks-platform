import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SUPPLY_LINKS } from "@/lib/resources/data";

export function ResourceList() {
    return (
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
    );
}

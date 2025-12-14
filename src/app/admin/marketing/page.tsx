
"use client";

import { useState } from "react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminMarketingPage() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch("/api/admin/marketing/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send");

            setStatus({ type: "success", text: `Sent to ${email}!` });
            setEmail("");
            setName("");
        } catch (err: unknown) {
            setStatus({ type: "error", text: (err as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <AdminTopNav active="marketing" />

            <main className="w-full px-6 lg:px-12 mt-8">
                <div className="max-w-2xl mx-auto space-y-8">

                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-serif text-slate-900">Push Campaigns</h1>
                        <p className="text-sm text-slate-500">Manually trigger marketing emails to guests.</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6">Book Direct Invitation</h2>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Guest Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@example.com"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Guest Name (Optional)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Alex"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-60 transition"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Invitation
                                </button>
                            </div>

                            {status && (
                                <div
                                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${status.type === "success"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        : "bg-red-50 text-red-600 border border-red-100"
                                        }`}
                                >
                                    {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {status.text}
                                </div>
                            )}
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
}

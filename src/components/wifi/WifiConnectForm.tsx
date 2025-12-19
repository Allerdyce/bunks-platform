
"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, Check, Copy, Loader2, Wifi } from "lucide-react";
import Link from "next/link";

interface WifiConnectFormProps {
    ssid: string;
    password?: string;
    propertySlug: string;
}

export function WifiConnectForm({ ssid, password, propertySlug }: WifiConnectFormProps) {
    const [email, setEmail] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate the Android/iOS WiFi connection string (QR code content format)
    // Format: WIFI:T:WPA;S:mynetwork;P:mypass;;
    // Using WPA as standard, could be WEP but unlikely for Bunks.
    const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // 1. Capture Lead
            await fetch("/api/wifi-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            // 2. Transition to Success
            setIsConnected(true);

            // 3. Attempt Native Deep Link (iOS/Android will parse this scheme if supported, mostly via QR reader context but web works sometimes)
            // Actually, browsers don't universally support `WIFI:` scheme as a deep link from href.
            // BUT, we can try.
            // If it fails, the UI below is the fallback.
            if (typeof window !== "undefined") {
                window.location.href = wifiString;
            }
        } catch (err) {
            console.error("Connection failed", err);
            // Even if API fails, let them connect (fail open)
            setIsConnected(true);
        } finally {
            setLoading(false);
        }
    };

    const copyPassword = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isConnected) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
                        <Wifi className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-emerald-400 font-medium mb-1">You're unlocked!</h3>
                    <p className="text-sm text-emerald-200/80">Connect to <strong>{ssid}</strong></p>
                </div>

                <div className="space-y-4">
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Network Password</label>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 font-mono text-lg text-white">{password}</code>
                            <button
                                onClick={copyPassword}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                            >
                                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <Link
                        href={`/property/${propertySlug}`}
                        className="block w-full text-center py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                    >
                        Explore Property Guide
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                    type="email"
                    id="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        Connect Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
}

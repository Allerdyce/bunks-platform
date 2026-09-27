"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, Check, Copy, Loader2, Wifi } from "lucide-react";

export type WifiTheme = "light" | "dark";

const THEMES = {
  light: {
    successCard: "bg-emerald-50 border-emerald-200",
    successTitle: "text-emerald-700",
    successText: "text-emerald-800/80",
    passwordCard: "bg-gray-50 border-gray-200",
    passwordValue: "text-gray-900",
    copyButton: "hover:bg-gray-200/70 text-gray-500 hover:text-gray-900",
    copiedIcon: "text-emerald-600",
    guideLink:
      "text-emerald-700 hover:text-emerald-600 hover:border-emerald-600/50",
    input: "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400",
    steps: "text-gray-600",
    offerCard: "bg-gray-100 border-gray-200",
    offerTitle: "text-gray-900",
    offerText: "text-gray-600",
    fineprint: "text-gray-500",
  },
  dark: {
    successCard: "bg-emerald-500/10 border-emerald-500/20",
    successTitle: "text-emerald-400",
    successText: "text-emerald-200/80",
    passwordCard: "bg-black/40 border-white/5",
    passwordValue: "text-white",
    copyButton: "hover:bg-white/10 text-gray-400 hover:text-white",
    copiedIcon: "text-emerald-400",
    guideLink:
      "text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/50",
    input: "bg-white/5 border-white/10 text-white placeholder:text-gray-600",
    steps: "text-gray-400",
    offerCard: "bg-white/5 border-white/10",
    offerTitle: "text-white",
    offerText: "text-gray-400",
    fineprint: "text-gray-500",
  },
} satisfies Record<WifiTheme, Record<string, string>>;

interface WifiConnectFormProps {
  ssid: string;
  password?: string;
  propertySlug?: string;
  guideUrl?: string;
  bookDirectUrl?: string;
  theme?: WifiTheme;
}

type CopyField = "ssid" | "password";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Older iOS / non-secure contexts: fall back to a hidden textarea.
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

export function WifiConnectForm({
  ssid,
  password,
  propertySlug,
  guideUrl,
  bookDirectUrl,
  theme = "dark",
}: WifiConnectFormProps) {
  const t = THEMES[theme];
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<CopyField | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch("/api/wifi-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, propertySlug }),
      });
    } catch (err) {
      // Fail open: never block a guest from getting online.
      console.error("Failed to save wifi lead", err);
    } finally {
      // Browsers can't join Wi-Fi from a web page (navigating to a WIFI: URI makes
      // Safari show "address is invalid"), so we show copyable details instead.
      setIsConnected(true);
      setLoading(false);
    }
  };

  const handleCopy = async (field: CopyField, value?: string) => {
    if (!value) return;
    if (await copyText(value)) {
      setCopied(field);
      setTimeout(
        () => setCopied((current) => (current === field ? null : current)),
        2000,
      );
    }
  };

  const renderCopyRow = (field: CopyField, label: string, value?: string) => (
    <button
      type="button"
      onClick={() => void handleCopy(field, value)}
      className={`w-full text-left rounded-xl p-4 border transition-colors ${t.passwordCard}`}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
        {label}
      </span>
      <span className="flex items-center gap-3">
        <code
          className={`flex-1 font-mono text-lg break-all ${t.passwordValue}`}
        >
          {value}
        </code>
        <span
          className={`flex items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors ${t.copyButton}`}
        >
          {copied === field ? (
            <>
              <Check className={`w-5 h-5 ${t.copiedIcon}`} /> Copied
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" /> Copy
            </>
          )}
        </span>
      </span>
    </button>
  );

  if (isConnected) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div
          className={`border rounded-2xl p-6 text-center mb-6 ${t.successCard}`}
        >
          <div className="mx-auto w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <h3 className={`font-medium mb-1 ${t.successTitle}`}>
            You&apos;re unlocked!
          </h3>
          <p className={`text-sm ${t.successText}`}>
            Connect to <strong>{ssid}</strong>
          </p>
        </div>

        <div className="space-y-3">
          {renderCopyRow("ssid", "Network", ssid)}
          {password && renderCopyRow("password", "Password", password)}
        </div>

        <ol
          className={`mt-5 space-y-1 text-sm list-decimal list-inside ${t.steps}`}
        >
          <li>
            Tap <strong>Copy</strong> next to the password
          </li>
          <li>
            Open <strong>Settings → Wi-Fi</strong> and choose{" "}
            <strong>{ssid}</strong>
          </li>
          <li>
            Paste the password and tap <strong>Join</strong>
          </li>
        </ol>

        {bookDirectUrl && (
          <div className={`mt-6 border rounded-2xl p-5 ${t.offerCard}`}>
            <p className={`font-medium mb-1 ${t.offerTitle}`}>
              Come back for 10% less
            </p>
            <p className={`text-sm mb-3 ${t.offerText}`}>
              Book your next stay directly with Bunks and save 10% compared to
              the same home on other booking platforms.
            </p>
            <a
              href={bookDirectUrl}
              className={`inline-flex items-center gap-2 text-sm font-medium ${t.guideLink}`}
            >
              See dates & direct rates
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {guideUrl && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            <a
              href={guideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 transition-colors text-sm font-medium border-b border-transparent pb-0.5 ${t.guideLink}`}
            >
              Your trip page &amp; house guide
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          id="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full border rounded-xl px-5 py-4 ${t.input} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Connect Now{" "}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className={`text-xs text-center ${t.fineprint}`}>
        We&apos;ll occasionally send you direct-booking offers. Unsubscribe
        anytime.
      </p>
    </form>
  );
}

"use client";

import { Layout } from "@/components/layout/Layout";
import { ViewState } from "@/types";

export function TotToolLayout({ children }: { children: React.ReactNode }) {
    // Dummy handler for the Navbar/Footer interactions.
    // Since we are on a separate route (/tools/sb-tot), standard next/link navigation 
    // inside Navbar/Footer will handle page transitions correctly.
    const handleNavigate = (target: ViewState, payload?: unknown) => {
        // No-op for static tool page
        console.log("TotToolLayout: Navigate to", target, payload);
    };

    return (
        <Layout
            onNavigate={handleNavigate}
            currentView="about" // Using 'about' as a neutral existing view type
            hideFooter={false}
        >
            {children}
        </Layout>
    );
}

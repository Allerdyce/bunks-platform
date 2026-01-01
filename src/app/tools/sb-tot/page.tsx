import TotWizard from "@/components/tools/TotWizard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Santa Barbara TOT Tax Return Helper | Free Calculations & PDF Generator",
    description: "Easily calculate and generate your Santa Barbara South County Transient Occupancy Tax (TOT) and TBID return. Free online tool for short-term rental hosts.",
    keywords: ["Santa Barbara TOT", "Transient Occupancy Tax", "TOT Return", "TBID", "Short Term Rental Tax", "Santa Barbara Host", "Airbnb Tax Helper"],
    openGraph: {
        title: "Santa Barbara TOT Tax Return Helper",
        description: "Simplify your monthly tax filing. Calculate TOT/TBID and generate the official PDF instantly.",
        type: "website",
    }
};

export default function TotHelperPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    {/* Bunks Logo / Branding could go here */}
                    <h1 className="text-4xl font-serif text-gray-900 tracking-tight">Tax Helper</h1>
                    <p className="text-lg text-gray-600">Simplifying tax compliance for Santa Barbara hosts.</p>
                </div>

                <TotWizard />

                <div className="text-center text-gray-400 text-xs mt-12">
                    <p>Not affiliated with the County of Santa Barbara.</p>
                    <p>Use at your own risk. Consult a tax professional for advice.</p>
                </div>
            </div>
        </div>
    );
}

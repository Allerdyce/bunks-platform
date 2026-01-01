"use client";

import { useState } from "react";
import { ArrowRight, Calculator, Check, Download, FileText, Loader2 } from "lucide-react";

type WizardStep = "INTRO" | "INFO" | "FINANCIALS" | "REVIEW" | "SUCCESS";

type TotData = {
    // Info
    reportingMonth: string;
    operatorName: string;
    situsAddress: string;
    city: string;
    state: string;
    zip: string;
    certificateNumber: string;

    // Financials
    grossRent: number;
    deductions31Plus: number;
    deductionsFederal: number;
    roomRevenueOnlyForTBID: number;
};

type CalculationResult = {
    line1_grossRent: number;
    line2_deductions31Plus: number;
    line3_deductionsFederal: number;
    line4_totalDeductions: number;
    line5_taxableRents: number;
    line6_tot: number;
    line7_tbid: number;
    line8_totalDue: number;
};

const InputGroup = ({ label, id, helperText, children }: { label: string; id: string; helperText?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        {children}
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
);

// Helper to format currency
const formatCurrency = (val: number) => {
    if (isNaN(val)) return "";
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

// Helper components
const CurrencyInput = ({
    id,
    value,
    onChange,
    placeholder = "0.00",
}: {
    id: string;
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState(value === 0 ? "" : value.toString());

    const displayValue = isFocused ? localValue : (value === 0 ? "" : formatCurrency(value));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;

        // Sanitize: remove currency symbols, commas, spaces
        raw = raw.replace(/[$,\s]/g, "");

        // Allow digits and one decimal point
        if (/^\d*\.?\d*$/.test(raw)) {
            setLocalValue(raw);
            onChange(raw === "" || raw === "." ? 0 : parseFloat(raw));
        }
    };

    return (
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
                type="text"
                id={id}
                inputMode="decimal"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                placeholder={placeholder}
                value={displayValue}
                onFocus={() => {
                    setIsFocused(true);
                    setLocalValue(value === 0 ? "" : value.toString());
                }}
                onBlur={() => setIsFocused(false)}
                onChange={handleChange}
            />
        </div>
    );
};

export default function TotWizard() {
    const [step, setStep] = useState<WizardStep>("INTRO");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TotData>({
        reportingMonth: "",
        operatorName: "",
        situsAddress: "",
        city: "Santa Barbara",
        state: "CA",
        zip: "",
        certificateNumber: "",
        grossRent: 0,
        deductions31Plus: 0,
        deductionsFederal: 0,
        roomRevenueOnlyForTBID: 0,
    });
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [showFederalDeduction, setShowFederalDeduction] = useState(false);


    const calculate = async () => {
        setLoading(true);
        try {
            // Validation
            const gross = Number(data.grossRent);
            const tbidBase = Number(data.roomRevenueOnlyForTBID);
            const deductions = Number(data.deductions31Plus) + Number(data.deductionsFederal);

            if (tbidBase > gross) {
                alert("Error: Room Revenue for TBID cannot be greater than Gross Rent.");
                setLoading(false);
                return;
            }

            if (deductions > gross) {
                alert("Error: Total Deductions cannot be greater than Gross Rent.");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/tools/sb-tot/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    grossRent: gross,
                    deductions31Plus: Number(data.deductions31Plus),
                    deductionsFederal: Number(data.deductionsFederal),
                    roomRevenueOnlyForTBID: tbidBase,
                }),
            });
            if (!res.ok) throw new Error("Calculation failed");
            const calculation = await res.json();
            setResult(calculation);
            setStep("REVIEW");
        } catch (err) {
            console.error(err);
            alert("Failed to calculate. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    const generatePdf = async () => {
        if (!result) return;
        setLoading(true);
        try {
            // Native Form Submission for robust file download
            // This bypasses client-side Blob handling nuances
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "/api/tools/sb-tot/pdf";
            form.style.display = "none";
            form.target = "_blank";

            // Prepare payload flat object
            // Format month for PDF (YYYY-MM -> Month Year)
            const [year, month] = data.reportingMonth.split("-");
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const formattedMonth = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

            const payload: Record<string, string | number> = {
                ...data,
                reportingMonth: formattedMonth, // Override with formatted
                ...result,
                line7_tbidBase: Number(data.roomRevenueOnlyForTBID),
                line7_tbidAmount: result.line7_tbid,
            };

            // Create hidden inputs for everything
            Object.entries(payload).forEach(([key, value]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value.toString();
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(form);
            }, 1000);

            setStep("SUCCESS");
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1 bg-gray-50 flex">
                <div
                    className={`h-full bg-emerald-500 transition-all duration-500 ease-out`}
                    style={{
                        width:
                            step === "INTRO" ? "10%" :
                                step === "INFO" ? "35%" :
                                    step === "FINANCIALS" ? "60%" :
                                        step === "REVIEW" ? "85%" : "100%"
                    }}
                />
            </div>

            <div className="p-8">
                {step === "INTRO" && (
                    <div className="space-y-6 text-center py-4">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Santa Barbara TOT Helper</h2>
                        <p className="text-gray-600">
                            Generate your official Transient Occupancy Tax (TOT) return in minutes.
                            Calculates amounts and fills the official PDF used by the Tax Collector.
                        </p>
                        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl text-left space-y-2">
                            <p><strong>Reminders:</strong></p>
                            <ul className="list-disc list-inside space-y-1 opacity-90">
                                <li>Monthly filing required even if $0 due.</li>
                                <li>Due by the last day of the following month.</li>
                                <li>TBID is 2% of room revenue only.</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => setStep("INFO")}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                            Start Return <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {step === "INFO" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-semibold text-gray-900">Business Information</h3>
                        <div className="space-y-4">
                            <InputGroup label="Reporting Month" id="reportingMonth">
                                <div className="flex gap-3">
                                    <select
                                        className="w-2/3 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75em_0.75em] bg-[right_1rem_center] bg-no-repeat pr-10"
                                        value={data.reportingMonth ? data.reportingMonth.split("-")[1] : ""}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            const year = data.reportingMonth ? data.reportingMonth.split("-")[0] : new Date().getFullYear().toString();
                                            setData({ ...data, reportingMonth: `${year}-${month}` });
                                        }}
                                    >
                                        <option value="" disabled>Month</option>
                                        {[
                                            { val: "01", label: "January" }, { val: "02", label: "February" }, { val: "03", label: "March" },
                                            { val: "04", label: "April" }, { val: "05", label: "May" }, { val: "06", label: "June" },
                                            { val: "07", label: "July" }, { val: "08", label: "August" }, { val: "09", label: "September" },
                                            { val: "10", label: "October" }, { val: "11", label: "November" }, { val: "12", label: "December" }
                                        ].map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                                    </select>

                                    <select
                                        className="w-1/3 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75em_0.75em] bg-[right_1rem_center] bg-no-repeat pr-10"
                                        value={data.reportingMonth ? data.reportingMonth.split("-")[0] : ""}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            const month = data.reportingMonth ? data.reportingMonth.split("-")[1] : "01";
                                            setData({ ...data, reportingMonth: `${year}-${month}` });
                                        }}
                                    >
                                        <option value="" disabled>Year</option>
                                        {Array.from({ length: 6 }, (_, i) => 2024 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </InputGroup>
                            <InputGroup
                                label="Operator Name"
                                id="operatorName"
                                helperText="Enter the legal name of the person or business responsible for this rental. This should match the name used on your Santa Barbara TOT registration."
                            >
                                <input
                                    type="text"
                                    id="operatorName"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Your Business Name"
                                    value={data.operatorName}
                                    onChange={(e) => setData({ ...data, operatorName: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup
                                label="Certificate Number (Optional)"
                                id="certificateNumber"
                                helperText="Your Santa Barbara Transient Occupancy Tax certificate number, if you have one. If you don't have it handy, you can leave this blank and fill it in on the printed form."
                            >
                                <input
                                    type="text"
                                    id="certificateNumber"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="TOT Certificate #"
                                    value={data.certificateNumber}
                                    onChange={(e) => setData({ ...data, certificateNumber: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="Property Address" id="situsAddress">
                                <input
                                    type="text"
                                    id="situsAddress"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Street Address"
                                    value={data.situsAddress}
                                    onChange={(e) => setData({ ...data, situsAddress: e.target.value })}
                                />
                            </InputGroup>
                            <div className="grid grid-cols-3 gap-3">
                                <InputGroup label="City" id="city">
                                    <input
                                        type="text"
                                        id="city"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                                        value={data.city}
                                        readOnly
                                    />
                                </InputGroup>
                                <InputGroup label="State" id="state">
                                    <input
                                        type="text"
                                        id="state"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                                        value={data.state}
                                        readOnly
                                    />
                                </InputGroup>
                                <InputGroup label="Zip" id="zip">
                                    <input
                                        type="text"
                                        id="zip"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="93108"
                                        value={data.zip}
                                        onChange={(e) => setData({ ...data, zip: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep("FINANCIALS")}
                            disabled={!data.reportingMonth || !data.operatorName || !data.situsAddress || !data.zip}
                            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next step <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {step === "FINANCIALS" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-semibold text-gray-900">Revenue & Deductions</h3>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
                            Enter full amounts. The tool will handle the math.
                        </div>
                        <div className="space-y-4">
                            <InputGroup
                                label="Gross Rent Collected (Line 1)"
                                id="grossRent"
                                helperText="Total rent collected for the month including mandatory fees such as cleaning fees. Do not subtract deductions here."
                            >
                                <CurrencyInput
                                    id="grossRent"
                                    value={data.grossRent}
                                    onChange={(val) => setData({ ...data, grossRent: val })}
                                />
                            </InputGroup>

                            <InputGroup
                                label="Deductions: 31+ Day Stays (Line 2)"
                                id="deductions31Plus"
                                helperText="Enter rent collected from stays of 31 consecutive days or longer during this month. These amounts are not subject to Santa Barbara TOT."
                            >
                                <CurrencyInput
                                    id="deductions31Plus"
                                    value={data.deductions31Plus}
                                    onChange={(val) => setData({ ...data, deductions31Plus: val })}
                                />
                            </InputGroup>

                            <div className="pt-2">
                                <button
                                    onClick={() => setShowFederalDeduction(!showFederalDeduction)}
                                    className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
                                >
                                    {showFederalDeduction ? "Hide" : "+ Add"} Federal Government Deduction (Line 3 – Optional)
                                </button>

                                {showFederalDeduction && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <InputGroup
                                            label="Deductions: Federal Government (Line 3)"
                                            id="deductionsFederal"
                                            helperText="Only include if the U.S. Federal Government paid directly and you have exemption documentation."
                                        >
                                            <CurrencyInput
                                                id="deductionsFederal"
                                                value={data.deductionsFederal}
                                                onChange={(val) => setData({ ...data, deductionsFederal: val })}
                                            />
                                        </InputGroup>
                                    </div>
                                )}
                            </div>

                            <InputGroup
                                label="Revenue for TBID Calculation"
                                id="roomRevenueOnlyForTBID"
                                helperText="Enter room revenue only for the month. Exclude cleaning fees, extra fees, and taxes. This amount is used to calculate the 2% Tourism Business Improvement District (TBID) fee."
                            >
                                <CurrencyInput
                                    id="roomRevenueOnlyForTBID"
                                    value={data.roomRevenueOnlyForTBID}
                                    onChange={(val) => setData({ ...data, roomRevenueOnlyForTBID: val })}
                                />
                            </InputGroup>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep("INFO")}
                                className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={calculate}
                                disabled={loading}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Calculate <Calculator className="w-5 h-5" /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === "REVIEW" && result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-900">Review & Generate</h3>
                            <p className="text-gray-500 text-sm">Review the calculated figures below.</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-3 font-mono text-sm border border-gray-100">
                            <div className="flex justify-between items-center text-gray-500">
                                <span>Line 1: Gross Rent (incl. mandatory fees)</span>
                                <span>${result.line1_grossRent.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                                <span>Line 4: Allowable Deductions</span>
                                <span>- ${result.line4_totalDeductions.toFixed(2)}</span>
                            </div>
                            {result.line3_deductionsFederal > 0 && (
                                <div className="flex justify-between items-center text-xs text-gray-400 pl-4 border-l-2 border-gray-200 ml-1">
                                    <span>(Incl. Line 3 Federal: ${result.line3_deductionsFederal.toFixed(2)})</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 my-2"></div>
                            <div className="flex justify-between items-center font-semibold text-gray-700">
                                <span>Line 5: Taxable Rents</span>
                                <span>${result.line5_taxableRents.toFixed(2)}</span>
                            </div>
                            <div className="py-2"></div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Line 6: TOT — 12% of taxable rents (Line 5)</span>
                                <span>${result.line6_tot.toFixed(2)}</span>
                            </div>
                            <div className="py-2"></div>
                            <div className="flex justify-between items-center text-gray-500">
                                <span>TBID Base: Room revenue only (used for Line 7)</span>
                                <span>${Number(data.roomRevenueOnlyForTBID).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Line 7: TBID (2% of room revenue only)</span>
                                <span>${result.line7_tbid.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-300 my-2"></div>
                            <div className="flex justify-between items-center font-bold text-lg text-emerald-600">
                                <span>Total Due (Line 8)</span>
                                <span>${result.line8_totalDue.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={generatePdf}
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl shadow-emerald-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Download PDF Return <Download className="w-5 h-5" /></>}
                        </button>
                        <button
                            onClick={() => setStep("FINANCIALS")}
                            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                        >
                            Edit Financials
                        </button>
                    </div>
                )}

                {step === "SUCCESS" && (
                    <div className="space-y-6 text-center py-8 animate-in zoom-in-95 duration-300">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                        <p className="text-gray-600 max-w-sm mx-auto">
                            Your PDF has been generated and downloaded.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4">
                            <h4 className="font-semibold text-gray-900">Next Steps:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                <li>Print the downloaded PDF.</li>
                                <li>Complete the signature section (Sign, Print Name, Title, Date, Phone).</li>
                                <li>Make check payable to <strong>Treasurer-Tax Collector</strong> for the <strong>Total Due: ${result?.line8_totalDue.toFixed(2)}</strong>.</li>
                                <li>
                                    Mail to:<br />
                                    <span className="font-medium text-gray-800 ml-4 block mt-1">
                                        Treasurer-Tax Collector<br />
                                        PO Box 579<br />
                                        Santa Barbara, CA 93102
                                    </span>
                                </li>
                            </ol>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Start Another Return
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

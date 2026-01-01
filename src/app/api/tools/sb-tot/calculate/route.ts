import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type CalculationRequest = {
    grossRent: number;
    deductions31Plus: number;
    deductionsFederal: number;
    roomRevenueOnlyForTBID: number;
};

const TOT_RATE = 0.12; // 12%
const TBID_RATE = 0.02; // 2%

export async function POST(req: NextRequest) {
    try {
        const body: CalculationRequest = await req.json();
        const { grossRent, deductions31Plus, deductionsFederal, roomRevenueOnlyForTBID } = body;

        const line1_grossRent = grossRent;
        const line2_deductions31Plus = deductions31Plus || 0;
        const line3_deductionsFederal = deductionsFederal || 0;

        // Validation
        if (roomRevenueOnlyForTBID > line1_grossRent) {
            return NextResponse.json(
                { error: 'Room Revenue for TBID cannot be greater than Gross Rent' },
                { status: 400 }
            );
        }

        const totalDeductionsCheck = line2_deductions31Plus + line3_deductionsFederal;
        if (totalDeductionsCheck > line1_grossRent) {
            return NextResponse.json(
                { error: 'Total Deductions cannot be greater than Gross Rent' },
                { status: 400 }
            );
        }

        // Line 4: Total deductions
        const line4_totalDeductions = line2_deductions31Plus + line3_deductionsFederal;

        // Line 5: Taxable Rents (1 - 4)
        const line5_taxableRents = Math.max(0, line1_grossRent - line4_totalDeductions);

        // Line 6: TOT (12% of Line 5)
        // Rounding to 2 decimal places properly
        const line6_tot = Math.round(line5_taxableRents * TOT_RATE * 100) / 100;

        // Line 7: TBID (2% of room revenue only)
        const line7_tbid = Math.round(roomRevenueOnlyForTBID * TBID_RATE * 100) / 100;

        // Line 8: Total Due
        const line8_totalDue = Math.round((line6_tot + line7_tbid) * 100) / 100;

        return NextResponse.json({
            line1_grossRent,
            line2_deductions31Plus,
            line3_deductionsFederal,
            line4_totalDeductions,
            line5_taxableRents,
            line6_tot,
            line7_tbid,
            line8_totalDue
        });
    } catch (error) {
        console.error('TOT Calculation error:', error);
        return NextResponse.json({ error: 'Failed to calculate' }, { status: 400 });
    }
}

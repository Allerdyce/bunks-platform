import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimitResponse } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const amount = z.coerce.number().min(0).max(1_000_000_000);
const calculationSchema = z.object({
    grossRent: amount,
    deductions31Plus: amount.optional(),
    deductionsFederal: amount.optional(),
    roomRevenueOnlyForTBID: amount.optional(),
    totRate: z.coerce.number().min(0).max(1).optional(),
});

const DEFAULT_TOT_RATE = 0.14; // Default 14%
const TBID_RATE = 0.02; // 2%

export async function POST(req: NextRequest) {
    const limited = rateLimitResponse(req, 'sb-tot-calculate', 60, 10 * 60_000);
    if (limited) return limited;

    try {
        const parsed = calculationSchema.safeParse(await req.json().catch(() => null));
        if (!parsed.success) {
            return NextResponse.json({ error: 'Please check the amounts and try again.' }, { status: 400 });
        }
        const { grossRent, deductions31Plus, deductionsFederal, totRate } = parsed.data;
        const roomRevenueOnlyForTBID = parsed.data.roomRevenueOnlyForTBID ?? 0;

        const effectiveTotRate = totRate !== undefined ? totRate : DEFAULT_TOT_RATE;

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

        // Line 6: TOT (Variable Rate * Line 5)
        // Rounding to 2 decimal places properly
        const line6_tot = Math.round(line5_taxableRents * effectiveTotRate * 100) / 100;

        // Line 7: TBID (2% of room revenue only)
        const line7_tbid = Math.round(roomRevenueOnlyForTBID * TBID_RATE * 100) / 100;

        const line8_totalDue = Math.round((line6_tot + line7_tbid) * 100) / 100;

        return NextResponse.json({
            line1_grossRent,
            line2_deductions31Plus,
            line3_deductionsFederal,
            line4_totalDeductions,
            line5_taxableRents,
            line6_tot,
            line7_tbid,
            line8_totalDue,
            totRate: effectiveTotRate
        });
    } catch (error) {
        console.error('TOT Calculation error:', error);
        return NextResponse.json({ error: 'Failed to calculate' }, { status: 400 });
    }
}

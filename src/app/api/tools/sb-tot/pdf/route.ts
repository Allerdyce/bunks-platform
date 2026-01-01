import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// retrigger build
export const runtime = 'nodejs';

type PdfRequest = {
    reportingMonth: string; // "January 2026"
    operatorName: string;
    situsAddress: string;
    city: string;
    state: string;
    zip: string;
    certificateNumber?: string;

    line1_grossRent: number;
    line2_deductions31Plus: number;
    line3_deductionsFederal: number;
    line4_totalDeductions: number;
    line5_taxableRents: number;
    line6_tot: number;
    line7_tbidBase: number;
    line7_tbidAmount: number;
    line8_totalDue: number;
};

// Helper: Format currency without dollar sign for form fields (or with, depending on field type. Usually numeric string is safest)
const fmt = (num: number) => num.toFixed(2);

// Helper to get value from body (JSON or FormData)
async function getBodyData(req: NextRequest): Promise<PdfRequest> {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return await req.json();
    } else {
        const formData = await req.formData();
        const data: any = {};
        formData.forEach((value, key) => {
            // Convert numbers
            if (['grossRent', 'deductions31Plus', 'deductionsFederal', 'roomRevenueOnlyForTBID',
                'line1_grossRent', 'line2_deductions31Plus', 'line3_deductionsFederal', 'line4_totalDeductions',
                'line5_taxableRents', 'line6_tot', 'line7_tbidBase', 'line7_tbidAmount', 'line8_totalDue'].includes(key)) {
                data[key] = Number(value);
            } else {
                data[key] = value.toString();
            }
        });
        return data as PdfRequest;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await getBodyData(req);

        const publicDir = path.join(process.cwd(), 'public');
        const templatePath = path.join(publicDir, 'Transient Occupancy Tax Return (Fillable) - South County (PDF).pdf');
        const templateBytes = fs.readFileSync(templatePath);

        const pdfDoc = await PDFDocument.load(templateBytes);
        const form = pdfDoc.getForm();

        // Mapping based on spec
        // Header
        form.getTextField('Reporting MonthYear').setText(body.reportingMonth);
        form.getTextField('Name of HotelOperator 1').setText(body.operatorName);

        form.getTextField('Address').setText(body.situsAddress);
        form.getTextField('City').setText(body.city);
        form.getTextField('State').setText(body.state);
        form.getTextField('Zip').setText(body.zip);

        if (body.certificateNumber) {
            form.getTextField('Certificate').setText(body.certificateNumber);
        }

        // Financials
        form.getTextField('GROSSRENT').setText(fmt(body.line1_grossRent));

        // Deductions
        form.getTextField('RENT:OCCUPANCY BY PERMANENT RESIDENTS').setText(fmt(body.line2_deductions31Plus));
        form.getTextField('RENT:FEDERALGOVERNMENT').setText(fmt(body.line3_deductionsFederal));
        form.getTextField('TOTALALLOWABLEDEDUCTIONS').setText(fmt(body.line4_totalDeductions));

        form.getTextField('TAXABLERENTS').setText(fmt(body.line5_taxableRents));
        form.getTextField('TAX:14%').setText(fmt(body.line6_tot));

        form.getTextField('TBIDFEE').setText(fmt(body.line7_tbidBase));
        form.getTextField('TBIDFEEAmt').setText(fmt(body.line7_tbidAmount));

        form.getTextField('TOTALTAXTBID').setText(fmt(body.line8_totalDue));
        form.getTextField('TOTALAMOUNTDUE').setText(fmt(body.line8_totalDue));

        // Workaround: Make all fields read-only instead of flattening
        form.getFields().forEach(field => {
            field.enableReadOnly();
        });

        const pdfBytes = await pdfDoc.save();

        // Generate Filename
        let filename = "SB_TOT_Return.pdf";
        if (body.reportingMonth) {
            // Sanitize
            const safeMonth = body.reportingMonth.replace(/[^a-z0-9-]/gi, '_');
            filename = `SB_TOT_Return_${safeMonth}.pdf`;
        }

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('PDF Generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/sendEmail";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { escapeHtml } from "@/lib/html";

export const runtime = "nodejs";

const requestSchema = z.object({
  name: z.string({ error: "Please enter your name." }).trim().min(1, "Please enter your name.").max(120),
  email: z.string({ error: "Please enter a valid email address." }).trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address.")),
  location: z.string({ error: "Where is your property?" }).trim().min(1, "Where is your property?").max(200),
  properties: z.coerce.number().int().min(1).max(500).optional(),
  listingUrl: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

// Owner "request a free Home Hub" form on /owners. Emails the support inbox; the owner's
// address is the Reply-To so answering the email reaches them directly.
export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "owner-interest", 5, 10 * 60_000);
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Please check the form.", field: issue?.path.join(".") }, { status: 400 });
  }
  const { name, email, location, properties, listingUrl, message } = parsed.data;

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Property location", location],
    ["Number of properties", properties ? String(properties) : "Not given"],
    ["Listing link", listingUrl || "Not given"],
    ["Message", message || "—"],
  ];

  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `Home Hub request: ${name} (${location})`,
      html:
        `<p>A property owner asked for a free Bunks Home Hub on bunks.com/owners.</p>` +
        `<table cellpadding="6">${rows
          .map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`)
          .join("")}</table>` +
        `<p>Reply to this email to reach them.</p>`,
    });
  } catch (error) {
    console.error("[owner-interest] Failed to send request", error);
    return NextResponse.json(
      { error: `Something went wrong sending your request. Please email ${SUPPORT_EMAIL} instead.` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

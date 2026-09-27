import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLEANER_SESSION_COOKIE, verifyCleanerSessionToken } from "@/lib/cleanerAuth";

/**
 * Server-side guard for cleaner pages. Layouts are not re-run on every navigation,
 * so each protected page must verify the session itself.
 */
export async function requireCleanerSession() {
    const cookieStore = await cookies();
    const session = verifyCleanerSessionToken(cookieStore.get(CLEANER_SESSION_COOKIE)?.value);
    if (!session) {
        redirect("/cleaner/login");
    }
    return session;
}

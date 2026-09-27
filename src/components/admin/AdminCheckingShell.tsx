import { AdminTopNav } from "@/components/admin/AdminTopNav";

type AdminSection = Parameters<typeof AdminTopNav>[0]["active"];

// Shown while an admin page confirms the session, so navigating between admin
// pages keeps the header in place instead of flashing the login form.
export function AdminCheckingShell({ active }: { active: AdminSection }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopNav active={active} />
    </div>
  );
}

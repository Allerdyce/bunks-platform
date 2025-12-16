'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/cleaner/logout', { method: 'POST' });
        router.push('/cleaner/login');
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
        </button>
    );
}

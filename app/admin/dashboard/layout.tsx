import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="shrink-0 flex items-center">
                                    <span className="text-xl font-bold text-gray-800">Cert Admin</span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                {/* Add Logout button here if needed */}
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="py-10">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}

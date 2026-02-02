import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/components/auth/user-nav";
import { Wrench } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Wrench className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Tool Forge</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/libraries" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Libraries
              </Link>
              <Link href="/materials" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Materials
              </Link>
              <Link href="/tools" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Tools
              </Link>
              <Link href="/machines" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Machines
              </Link>
              <Link href="/holders" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Holders
              </Link>
            </nav>

            {/* User Menu */}
            <UserNav user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

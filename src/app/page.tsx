import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, Zap, Download, Shield } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Tool Forge</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/libraries" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Libraries
              </Link>
              <Link href="/materials" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Materials
              </Link>
              <Link href="/tools" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Tools
              </Link>
              <Link href="/holders" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Holders
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Generate Fusion360 Tool Libraries
            <span className="text-primary block mt-2">with AI Assistance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Extract tool geometry from vendor URLs, PDFs, or text. Get optimized
            feeds and speeds for your specific CNC machine and materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? "/dashboard" : "/signup"}>
              <Button size="lg" className="w-full sm:w-auto">
                {user ? "Go to Dashboard" : "Start Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                AI-Powered Extraction
              </h3>
              <p className="text-gray-600">
                Paste a vendor URL, upload a PDF, or enter text. Our AI extracts
                tool geometry automatically - diameter, flutes, lengths, and
                more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Machine-Specific Presets
              </h3>
              <p className="text-gray-600">
                Select your CNC machine and target materials. Get optimized
                feeds and speeds that respect your spindle limits and machine
                capabilities.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Fusion360 Ready
              </h3>
              <p className="text-gray-600">
                Download a .tools file ready for direct import into Fusion360.
                All your tools with proper geometry and cutting presets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Create your first tool library in minutes, not hours.
          </p>
          <Link href={user ? "/dashboard" : "/signup"}>
            <Button size="lg">
              {user ? "Go to Dashboard" : "Create Free Account"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Tool Forge by FixturFab
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              tools.fixturfab.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

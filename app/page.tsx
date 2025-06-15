import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Building2, MapPinned } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className=" min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
        <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
          Manage Your Workforce and Clients
          <span className="block text-orange-500 mt-2">
            All In One Dashboard
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Our SaaS platform empowers security and maintenance companies to
          manage employees, track clients, and monitor branch performance — all
          in real time.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/auth/sign-up">
            <Button className="px-6 py-3 text-lg">Start Free Trial</Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" className="px-6 py-3 text-lg">
              Watch Demo
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">
            Powerful Features to Streamline Your Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                <h3 className="text-xl font-semibold">Employee Management</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Add, assign, and track employees across multiple job sites.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                <h3 className="text-xl font-semibold">Client Profiles</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Keep detailed records of all your client companies and
                  contracts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                <h3 className="text-xl font-semibold">Branch Locations</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Organize client branches, locations, and active site teams in
                  one place.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MapPinned className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                <h3 className="text-xl font-semibold">Real-Time Overview</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Instantly view where your employees are working and monitor
                  job site status.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900">
          Ready to simplify your workforce management?
        </h2>
        <p className="text-lg text-gray-600 mt-4">
          Try our platform for free. No credit card required.
        </p>
        <div className="mt-6">
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8 py-4">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

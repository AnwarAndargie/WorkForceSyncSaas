"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Building2, MapPinned } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Arbitrary imports; replace with your actual paths
import SignInPage from "./auth/sign-in/page";
import SignUpPage from "./auth/sign-up/page";

export default function Home() {
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Half: SaaS Description */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center py-12 lg:py-16">
        <div className="max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
            Manage Your Workforce and Clients
            <span className="block text-orange-500 mt-2">
              All In One Dashboard
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Our SaaS platform empowers security and maintenance companies to
            manage employees, track clients, and monitor branch performance —
            all in real time.
          </p>
          <div className="mt-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Employee Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Add, assign, and track employees across multiple job sites.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Client Profiles
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Keep detailed records of all your client companies and
                    contracts.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Branch Locations
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Organize client branches, locations, and active site teams
                    in one place.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPinned className="mx-auto mb-4 h-10 w-10 text-orange-500" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Real-Time Overview
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Instantly view where your employees are working and monitor
                    job site status.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-8">
            <Button
              className="px-6 py-3 text-lg bg-orange-500 text-white hover:bg-orange-600"
              onClick={() =>
                document
                  .getElementById("auth-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Right Half: Sign-In/Sign-Up Form */}
      <div className="lg:w-1/2 flex items-center justify-center bg-gray-100 py-12 lg:py-0">
        <Card className="w-full max-w-md mx-4 sm:mx-6" id="auth-form">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {authMode === "signin" ? "Sign In" : "Sign Up"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {authMode === "signin"
                  ? "Access your dashboard"
                  : "Create your account"}
              </p>
            </div>
            <Tabs
              value={authMode}
              onValueChange={(value) =>
                setAuthMode(value as "signin" | "signup")
              }
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-6">
                <SignInPage />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <SignUpPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

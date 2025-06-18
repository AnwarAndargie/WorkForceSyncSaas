"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Building2, MapPinned } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInPage from "./auth/sign-in/page";
import SignUpPage from "./auth/sign-up/page";

export default function Home() {
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Half: SaaS Description */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center py-6 lg:py-8">
        <div className="max-w-xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Manage Your Workforce
            <span className="block text-orange-500 mt-1">
              All In One Dashboard
            </span>
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Empower security and maintenance companies to manage employees,
            track clients, and monitor branches in real time.
          </p>
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    Employee Management
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Assign and track employees across job sites.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    Client Profiles
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Manage client companies and contracts.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    Branch Locations
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Organize branches and site teams.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPinned className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    Real-Time Overview
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Monitor employee locations and job status.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="px-4 py-2 text-base bg-orange-500 text-white hover:bg-orange-600"
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
      <div className="lg:w-1/2 flex items-center justify-center bg-gray-100 py-10 lg:py-0 h-full">
        <Card
          className="w-full max-w-sm mx-4 sm:mx-6 mt-6 lg:mt-0"
          id="auth-form"
        >
          <CardContent className="p-2">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {authMode === "signin" ? "Sign In" : "Sign Up"}
              </h2>
              <p className="mt-1 text-xs text-gray-600">
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
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-0">
                <SignInPage />
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <SignUpPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

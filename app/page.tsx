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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Half: SaaS Description */}
      <div className="lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-700 text-white flex items-center justify-center py-12 lg:py-0">
        <div className="max-w-xl px-6 sm:px-8 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Empower Your Workforce
            <span className="block mt-2">With One Dashboard</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-100">
            Streamline employee tracking, client management, and branch
            oversight for your security and maintenance business.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="h-6 w-6 mt-1" />
              <p className="text-sm">
                Manage employees across multiple branches.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 mt-1" />
              <p className="text-sm">Track client contracts and profiles.</p>
            </div>
            <div className="flex items-start space-x-3">
              <Building2 className="h-6 w-6 mt-1" />
              <p className="text-sm">Organize branches and site teams.</p>
            </div>
            <div className="flex items-start space-x-3">
              <MapPinned className="h-6 w-6 mt-1" />
              <p className="text-sm">Monitor operations in real-time.</p>
            </div>
          </div>
          <div className="mt-8">
            <Button
              className="px-6 py-3 text-lg bg-white text-orange-600 hover:bg-gray-100"
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
      <div className="lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 lg:py-0">
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

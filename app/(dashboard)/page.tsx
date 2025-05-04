import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  BookOpen,
  CheckSquare,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Empower Your Team
                <span className="block text-orange-500">
                  With Smart Management
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Streamline team collaboration, track performance with quizzes
                and tasks, and grow your business with powerful analytics and
                seamless subscription management.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <a href="/sign-up">
                  <Button
                    size="lg"
                    className="text-lg rounded-full bg-orange-600 text-white hover:bg-orange-500 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              {/* Placeholder for dashboard screenshot */}
              <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden shadow-xl cursor-pointer transform-all duration-1000 hover:scale-105">
                <Image
                  src="/assets/dashboard-screenshot.png"
                  alt="Dashboard Preview"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
              Our platform equips organizations with tools to manage teams,
              drive learning, and make data-driven decisions.
            </p>
          </div>
          <div className="mt-12 lg:grid lg:grid-cols-3 lg:gap-8">
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Interactive Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Engage your team with quizzes to boost knowledge and track
                  performance. Personalized analytics help members improve.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Task Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Assign and track tasks with deadlines to keep your team on
                  schedule. Monitor progress with ease.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Powerful Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Gain insights with role-based dashboards for organization
                  metrics, team rankings, and individual performance.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Track and convert leads with integrated tools, designed for
                  organization admins to drive growth.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Seamless Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Manage subscriptions effortlessly with Stripe integration,
                  offering flexible plans for your organization.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-10 lg:mt-0">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      fill="currentColor"
                      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm0 4a1 1 0 0 0-1 1v4.586l-2.293-2.293a1 1 0 0 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z"
                    />
                  </svg>
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Scalable Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Built with Next.js, Postgres, and Drizzle ORM for performance
                  and scalability as your organization grows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted by Teams Worldwide
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
              Hear from organizations and team members who’ve transformed their
              workflows with our platform.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-base text-gray-500 italic">
                  “The quiz feature has revolutionized how we train our team.
                  The analytics help us identify strengths and gaps instantly.”
                </p>
                <p className="mt-4 text-sm font-medium text-gray-900">
                  Sarah J., Team Lead
                </p>
                <p className="text-sm text-gray-500">Tech Innovations Inc.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-base text-gray-500 italic">
                  “Managing subscriptions and leads in one platform saves us
                  hours every week. It’s intuitive and powerful.”
                </p>
                <p className="mt-4 text-sm font-medium text-gray-900">
                  Michael R., Org Admin
                </p>
                <p className="text-sm text-gray-500">Growth Solutions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-base text-gray-500 italic">
                  “As a member, I love the task tracking and personalized
                  dashboards. It keeps me focused and motivated.”
                </p>
                <p className="mt-4 text-sm font-medium text-gray-900">
                  Emily T., Team Member
                </p>
                <p className="text-sm text-gray-500">Creative Agency</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-500 m-10 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Start Managing Your Team Today
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-orange-100">
                Join thousands of organizations using our platform to streamline
                workflows, enhance learning, and drive growth. Sign up now or
                request a demo.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <a href="/sign-up">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-white text-orange-500 hover:bg-orange-600 cursor-pointer"
                >
                  Sign Up Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
              <a href="/contact">
                <Button
                  size="lg"
                  className="text-lg bg-white rounded-full text-orange-500 hover:bg-orange-600 cursor-pointer"
                >
                  Request a Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

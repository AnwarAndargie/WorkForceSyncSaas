"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Play } from "lucide-react";

// Mock Quiz type based on schema.ts, with added description for display
type Quiz = {
  id: string;
  title: string;
  description: string; // Added for UI
  userId: string;
  teamId: string;
  organizationId: string;
  score: number;
  totalQuestions: number;
  completedAt?: Date;
  createdAt: Date;
};

// Dummy quiz data
const mockQuizzes: Quiz[] = [
  {
    id: "quiz-1",
    title: "Team Quiz 1",
    description:
      "Test your knowledge on team collaboration tools and strategies.",
    userId: "user-123",
    teamId: "team-123",
    organizationId: "org-123",
    score: 80,
    totalQuestions: 20,
    completedAt: new Date("2025-04-20"),
    createdAt: new Date("2025-04-15"),
  },
  {
    id: "quiz-2",
    title: "Product Knowledge Quiz",
    description:
      "Assess your understanding of our product features and benefits.",
    userId: "user-123",
    teamId: "team-123",
    organizationId: "org-123",
    score: 0,
    totalQuestions: 15,
    completedAt: undefined,
    createdAt: new Date("2025-05-01"),
  },
  {
    id: "quiz-3",
    title: "Weekly Challenge",
    description: "A quick quiz to keep your skills sharp.",
    userId: "user-123",
    teamId: "team-123",
    organizationId: "org-123",
    score: 0,
    totalQuestions: 10,
    completedAt: undefined,
    createdAt: new Date("2025-05-03"),
  },
  {
    id: "quiz-4",
    title: "Customer Service Basics",
    description: "Learn the fundamentals of excellent customer support.",
    userId: "user-123",
    teamId: "team-123",
    organizationId: "org-123",
    score: 90,
    totalQuestions: 25,
    completedAt: new Date("2025-04-25"),
    createdAt: new Date("2025-04-20"),
  },
  {
    id: "quiz-5",
    title: "Advanced Sales Techniques",
    description: "Master strategies for closing high-value deals.",
    userId: "user-123",
    teamId: "team-123",
    organizationId: "org-123",
    score: 0,
    totalQuestions: 30,
    completedAt: undefined,
    createdAt: new Date("2025-05-02"),
  },
];

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>(mockQuizzes);

  useEffect(() => {
    // Filter quizzes based on search query
    const filtered = mockQuizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredQuizzes(filtered);
  }, [searchQuery]);

  const handleAddQuiz = () => {
    // Placeholder for adding a quiz (e.g., open modal or redirect)
    console.log("Add Quiz clicked");
    alert("Add Quiz functionality to be implemented");
  };

  const handleQuizAction = (quizId: string) => {
    // Placeholder for starting or viewing quiz
    console.log(`Action for quiz ${quizId}`);
    window.location.href = `/dashboard/quizzes/${quizId}`;
  };

  return (
    <div className="flex-1 p-4 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Section: Search Bar and Add Quiz Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleAddQuiz}
          className="bg-orange-400 text-white hover:bg-orange-300 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Quiz
        </Button>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">{quiz.description}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(quiz.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Questions: {quiz.totalQuestions}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {quiz.completedAt ? "Completed" : "Not Started"}
                </p>
                {quiz.completedAt && (
                  <p className="text-sm text-gray-500">
                    Score: {quiz.score}/{quiz.totalQuestions} (
                    {((quiz.score / quiz.totalQuestions) * 100).toFixed(1)}%)
                  </p>
                )}
                <Button
                  variant={quiz.completedAt ? "outline" : "default"}
                  className={
                    quiz.completedAt
                      ? ""
                      : "bg-orange-400 text-white hover:bg-orange-300 cursor-pointer"
                  }
                  onClick={() => handleQuizAction(quiz.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {quiz.completedAt ? "View Details" : "Start Quiz"}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No quizzes found.
          </p>
        )}
      </div>
    </div>
  );
}

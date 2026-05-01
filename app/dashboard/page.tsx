"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, History, Play, Trophy, ArrowLeft } from "lucide-react";

type Interview = {
  score: number;
  date: string;
};

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("interviews") || "[]");
    setInterviews(data);
  }, []);

  const bestScore = interviews.length
    ? Math.max(...interviews.map((i) => i.score))
    : "—";

  const averageScore = interviews.length
    ? Math.round(
        interviews.reduce((total, interview) => total + interview.score, 0) /
          interviews.length
      )
    : "—";

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Welcome back
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Your Dashboard
            </h1>
            <p className="mt-3 text-slate-600">
              Track your mock interview progress and start a new practice session.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/">
              <Button
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back Home
              </Button>
            </Link>

            <Link href="/setup">
              <Button className="rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700">
                <Play className="mr-2 h-4 w-4" />
                Start New Interview
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card className="rounded-3xl border-slate-200 bg-white">
            <CardContent className="p-6">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
              <p className="mt-4 text-sm text-slate-500">Total Questions</p>
              <h2 className="mt-1 text-3xl font-black">{interviews.length}</h2>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white">
            <CardContent className="p-6">
              <Trophy className="h-6 w-6 text-emerald-600" />
              <p className="mt-4 text-sm text-slate-500">Best Score</p>
              <h2 className="mt-1 text-3xl font-black">{bestScore}</h2>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white">
            <CardContent className="p-6">
              <History className="h-6 w-6 text-emerald-600" />
              <p className="mt-4 text-sm text-slate-500">Average Score</p>
              <h2 className="mt-1 text-3xl font-black">{averageScore}</h2>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 rounded-3xl border-slate-200 bg-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Recent Questions
            </h2>

            {interviews.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="font-medium text-slate-700">
                  No questions saved yet.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Complete your first mock interview and your progress will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {interviews.map((interview, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <Link
                      href={`/dashboard/${index}`}
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
                    >
                      <p className="font-medium text-slate-700">
                      Question {index + 1} : {" "}
                      <span className="font-bold text-emerald-700">
                        {interview.score}/100
                      </span>
                    </p>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
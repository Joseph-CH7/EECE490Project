"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  History,
  Play,
  Target,
  Trophy,
} from "lucide-react";

type Interview = {
  score: number;
  date?: string;
};

type Challenge = {
  title?: string;
  major?: string;
  type?: string;
  score: number;
  level?: string;
  feedback?: string;
  date?: string;
  usedML?: boolean;
  qualitySimilarity?: number;
  relevanceSimilarity?: number;
};

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const savedInterviews = JSON.parse(
      localStorage.getItem("interviews") || "[]"
    );

    const savedChallenges = JSON.parse(
      localStorage.getItem("challenges") || "[]"
    );

    setInterviews(savedInterviews);
    setChallenges(savedChallenges);
  }, []);

  const bestInterviewScore = interviews.length
    ? Math.max(...interviews.map((i) => Number(i.score)))
    : "—";

  const averageInterviewScore = interviews.length
    ? Math.round(
        interviews.reduce(
          (total, interview) => total + Number(interview.score),
          0
        ) / interviews.length
      )
    : "—";

  const bestChallengeScore = challenges.length
    ? Math.max(...challenges.map((c) => Number(c.score)))
    : "—";

  const averageChallengeScore = challenges.length
    ? Math.round(
        challenges.reduce(
          (total, challenge) => total + Number(challenge.score),
          0
        ) / challenges.length
      )
    : "—";

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Welcome back
              </p>

              <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                Your Dashboard
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">
                Track your real-time interviews, practice challenges, and
                progress over time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back Home
                </Button>
              </Link>

              <Link href="/challenges">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Practice Challenges
                </Button>
              </Link>

              <Link href="/setup">
                <Button className="w-full rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700 sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Start Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Interview Stats */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">
            Real-Time Interviews
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Interviews Completed
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {interviews.length}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <Trophy className="h-6 w-6 text-emerald-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Best Interview Score
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {bestInterviewScore}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <History className="h-6 w-6 text-emerald-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Average Interview Score
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {averageInterviewScore}
                </h3>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Challenge Stats */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">
            Practice Challenges
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <Target className="h-6 w-6 text-blue-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Challenges Completed
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {challenges.length}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <Trophy className="h-6 w-6 text-blue-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Best Challenge Score
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {bestChallengeScore}
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white">
              <CardContent className="p-6">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Average Challenge Score
                </p>
                <h3 className="mt-1 text-3xl font-black">
                  {averageChallengeScore}
                </h3>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Lists */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Recent Interviews */}
          <Card className="rounded-3xl border-slate-200 bg-white">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Recent Interviews
              </h2>

              {interviews.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-medium text-slate-700">
                    No interviews saved yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Complete your first real-time interview and your results
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {interviews.map((interview, index) => (
                    <Link
                      href={`/dashboard/${index}`}
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
                    >
                      <div>
                        <p className="font-medium text-slate-700">
                          Interview {index + 1}
                        </p>
                        <p className="text-sm text-slate-500">
                          {interview.date || "Completed session"}
                        </p>
                      </div>

                      <span className="font-bold text-emerald-700">
                        {interview.score}/100
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Challenges */}
          <Card className="rounded-3xl border-slate-200 bg-white">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Completed Challenges
              </h2>

              {challenges.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-medium text-slate-700">
                    No completed challenges yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Complete your first challenge and your results will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {challenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {challenge.title || `Challenge ${index + 1}`}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {challenge.major || "Practice Challenge"}
                            {challenge.type ? ` · ${challenge.type}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {challenge.date || "Completed challenge"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-black text-blue-700">
                            {challenge.score}/100
                          </p>
                          <p className="text-sm text-slate-600">
                            {challenge.level || "Completed"}
                          </p>
                        </div>
                      </div>

                      {challenge.usedML && (
                        <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-slate-500">
                              Semantic Quality
                            </p>
                            <p className="font-bold">
                              {challenge.qualitySimilarity ?? "—"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-slate-500">
                              Question Relevance
                            </p>
                            <p className="font-bold">
                              {challenge.relevanceSimilarity ?? "—"}
                            </p>
                          </div>
                        </div>
                      )}

                      {challenge.feedback && (
                        <p className="mt-3 text-sm text-slate-700">
                          <strong>Feedback:</strong> {challenge.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
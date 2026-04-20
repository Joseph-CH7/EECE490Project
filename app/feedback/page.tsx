"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Star, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const feedback = {
  totalScore: 82,
  relevance: 8.5,
  keyword: 7.5,
  semantic: 8.2,
  strengths: [
    "You gave a concrete example instead of staying too general.",
    "Your answer showed ownership and clear technical contribution.",
    "Your structure was logical and easy to follow.",
  ],
  improvements: [
    "Quantify the result more clearly with measurable impact.",
    "Mention one technical tradeoff or decision you personally made.",
    "Tie the example back to the target role more directly.",
  ],
  followUp:
    "You mentioned debugging the system. What exact tools or steps did you use to isolate the root cause?",
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black tracking-tight">InterviewPro</p>
            <p className="text-sm text-slate-500">Feedback and analysis</p>
          </div>

          <Link href="/interview">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Interview
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-3">
          <Badge className="rounded-full bg-emerald-100 px-4 py-1 text-emerald-700 hover:bg-emerald-100">
            Feedback & Analysis
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Review your answer and improve the next one
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            This page summarizes answer quality, highlights strengths and improvement areas, and proposes a targeted follow-up question.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card className="rounded-[2rem] border-0 bg-[#0E2A47] text-white shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-emerald-300">Your Answer</h2>

              <div className="mt-6 min-h-[380px] rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-base leading-8 text-slate-100">
                In one project, I built a backend service using Python and FastAPI to handle interview generation and scoring.
                My role was to design the API routes, connect the processing pipeline, and debug generation issues until the app returned meaningful questions.
                I also worked on improving the structure of the outputs so the frontend could display them clearly for users.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-950">Feedback</h2>

                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">{feedback.totalScore}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Relevance</p>
                  <p className="mt-1 text-xl font-bold">{feedback.relevance}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Keywords</p>
                  <p className="mt-1 text-xl font-bold">{feedback.keyword}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Semantic</p>
                  <p className="mt-1 text-xl font-bold">{feedback.semantic}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="font-semibold text-emerald-800">Strengths</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-emerald-900">
                    {feedback.strengths.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="font-semibold text-amber-800">Improvements</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900">
                    {feedback.improvements.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <p className="font-semibold text-slate-900">Follow-up Question</p>
                </div>

                <p className="mt-3 leading-7 text-slate-700">{feedback.followUp}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Link href="/interview">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Question
            </Button>
          </Link>

          <Button className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600">
            Next Question
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InterviewSessionFeedback } from "@/lib/interview-feedback";

const fallbackFeedback: InterviewSessionFeedback = {
  totalScore: 82,
  relevance: 8.5,
  keyword: 7.5,
  semantic: 8.2,
  delivery: 7.8,
  visualPresence: 7.4,
  strengths: [
    "You gave clear, concrete examples in several answers.",
    "Your answers showed ownership and solid technical contribution.",
    "Your overall structure was logical and easy to follow.",
  ],
  improvements: [
    "Quantify results more consistently across answers.",
    "Mention tradeoffs and decisions more explicitly.",
    "Tie examples back to the target role more directly.",
  ],
  followUp:
    "Across the interview, which answer would you improve first, and how would you make it more specific, measurable, or better structured?",
  answerCount: 3,
  averageAnswerLength: 58,
  includesExampleRate: 0.67,
  includesOutcomeRate: 0.67,
  visualMetrics: null,
  entries: [
    {
      question: "Tell me about a project where you solved a real technical problem.",
      answer:
        "I built a backend service using Python and FastAPI to handle interview generation and scoring, and I improved the API flow so the frontend could display the results clearly.",
      feedback: {
        totalScore: 82,
        relevance: 8.5,
        keyword: 7.5,
        semantic: 8.2,
        delivery: 7.8,
        visualPresence: 7.4,
        strengths: [
          "You grounded your answer in a concrete example instead of staying too general.",
          "You referenced the outcome or impact, which makes your answer more convincing.",
        ],
        improvements: [
          "Add a bit more structure: situation, action, and result in separate clear steps.",
        ],
        followUp:
          "You mentioned FastAPI. Why was that the right choice for this situation, and what would have been the main alternative?",
        answerLength: 35,
        includesExample: true,
        includesOutcome: true,
        visualMetrics: null,
      },
    },
  ],
};

export default function FeedbackPage() {
  const [feedback] = useState<InterviewSessionFeedback>(() => {
    if (typeof window === "undefined") {
      return fallbackFeedback;
    }

    const savedFeedback =
      localStorage.getItem("interviewSessionFeedback") ||
      localStorage.getItem("latestInterviewFeedback");

    if (!savedFeedback) {
      return fallbackFeedback;
    }

    try {
      return JSON.parse(savedFeedback) as InterviewSessionFeedback;
    } catch (error) {
      console.error("Could not parse saved session feedback:", error);
      return fallbackFeedback;
    }
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black tracking-tight">InterviewPro</p>
            <p className="text-sm text-slate-500">Feedback and analysis</p>
          </div>

          <Link href="/">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-3">
          <Badge className="rounded-full bg-emerald-100 px-4 py-1 text-emerald-700 hover:bg-emerald-100">
            Overall Interview Feedback
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Review your full interview performance
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            This summary combines all scored answers from the session so the final feedback reflects
            your overall interview performance, not only the last question.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card className="rounded-[2rem] border-0 bg-[#0E2A47] text-white shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-emerald-300">Interview Summary</h2>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white">
                  <Star className="h-4 w-4 text-emerald-300" />
                  <span className="font-semibold">{feedback.totalScore}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Answers Scored</p>
                  <p className="mt-1 text-2xl font-bold text-white">{feedback.answerCount}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Avg. Answer Length</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {feedback.averageAnswerLength} words
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Example Coverage</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {Math.round(feedback.includesExampleRate * 100)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Outcome Coverage</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {Math.round(feedback.includesOutcomeRate * 100)}%
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Per-Question Breakdown
                </p>

                <div className="mt-4 max-h-[360px] space-y-4 overflow-y-auto pr-1">
                  {feedback.entries.map((entry, index) => (
                    <div key={`${entry.question}-${index}`} className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                        Question {index + 1}
                      </p>
                      <p className="mt-2 font-semibold text-white">{entry.question}</p>
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-200">
                        {entry.answer}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-200">
                        <span>Score: {entry.feedback.totalScore}/100</span>
                        <span>Length: {entry.feedback.answerLength} words</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-950">Overall Scores</h2>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Delivery</p>
                  <p className="mt-1 text-xl font-bold">{feedback.delivery}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Visual Presence</p>
                  <p className="mt-1 text-xl font-bold">{feedback.visualPresence}</p>
                </div>
              </div>

              {feedback.visualMetrics ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Face In Frame</p>
                    <p className="mt-1 text-xl font-bold">
                      {Math.round(feedback.visualMetrics.faceDetectedRatio * 100)}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Eye Contact</p>
                    <p className="mt-1 text-xl font-bold">
                      {feedback.visualMetrics.averageEyeContactScore}%
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="font-semibold text-emerald-800">Overall Strengths</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-emerald-900">
                    {feedback.strengths.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="font-semibold text-amber-800">Priority Improvements</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900">
                    {feedback.improvements.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <p className="font-semibold text-slate-900">Overall Reflection Prompt</p>
                </div>

                <p className="mt-3 leading-7 text-slate-700">{feedback.followUp}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Link href="/">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
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

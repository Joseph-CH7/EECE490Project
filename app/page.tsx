"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Briefcase,
  Bot,
  Mic,
  BarChart3,
  MessageSquare,
  Target,
  Brain,
  CheckCircle2,
  Play,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function HomePage() {
  const { isSignedIn, user } = useUser();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(5,150,105,0.14),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(15,23,42,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,252,1))]" />
      <div className="pointer-events-none absolute left-1/2 top-28 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group">
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-950">
                InterviewPro
              </p>
              <p className="text-sm text-slate-500">Mock interview platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
            <Link
              href="/preview"
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              Preview
            </Link>

            <Link
              href="/setup"
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              Start Interview
            </Link>

            <Link
              href="/challenges"
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              Challenges
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="hidden rounded-full bg-white sm:inline-flex"
                  >
                    Sign In
                  </Button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <Button className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-14 pt-14 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left */}
          <div className="max-w-2xl">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 hover:bg-emerald-50">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {isSignedIn
                ? "Welcome back"
                : "AI + ML powered interview preparation"}
            </Badge>

            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.94] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              {isSignedIn
                ? `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}.`
                : "Practice smarter. Interview stronger."}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {isSignedIn
                ? "Continue your mock interviews, complete role-based challenges, and review your AI progress dashboard."
                : "Train with realistic interviews, CV-based questions, challenge tasks, ML scoring, and a dashboard that tracks your readiness over time."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/setup">
                <Button className="h-12 rounded-full bg-emerald-600 px-6 text-white shadow-[0_12px_28px_rgba(5,150,105,0.24)] hover:bg-emerald-700">
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-slate-200 bg-white/90 px-6 text-slate-700 hover:bg-white"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Mini stats / value cards */}
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-950">CV</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Grounded interview questions
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-950">
                  Challenges
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Role-based practice tasks
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Brain className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-950">ML</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Scoring and progress prediction
                </p>
              </div>
            </div>
          </div>

          {/* Right interactive mockup */}
          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-8 rounded-[3rem] bg-emerald-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.8rem] border border-slate-800/90 bg-[linear-gradient(180deg,#081225_0%,#0f172a_52%,#111827_100%)] p-5 shadow-[0_34px_90px_rgba(2,6,23,0.42)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_24%)]" />

              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                  Live Interview Simulation
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  Question 1 of 4
                </span>
              </div>

              <div className="relative mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/72 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Current Question
                    </p>

                    <h3 className="mt-3 text-[1.75rem] font-black leading-[1.05] tracking-tight text-white">
                      Describe a project where you used Python to build a real
                      application or solve a practical problem.
                    </h3>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/72 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-400">
                        Candidate Answer
                      </p>

                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        Recording
                      </span>
                    </div>

                    <div className="mt-3 rounded-[1.25rem] border border-emerald-400/15 bg-slate-950/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <p className="text-sm leading-7 text-slate-300">
                        I built a backend service using Python and FastAPI to
                        generate interview questions, score answers, and save
                        user progress...
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-xs text-slate-500">Clarity</p>
                      <p className="mt-1 text-lg font-black text-emerald-300">
                        86%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-xs text-slate-500">Relevance</p>
                      <p className="mt-1 text-lg font-black text-emerald-300">
                        91%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-xs text-slate-500">Depth</p>
                      <p className="mt-1 text-lg font-black text-emerald-300">
                        78%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/76 p-5">
                    <div className="flex min-h-[210px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-950/80 text-center">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
                        <Mic className="relative h-8 w-8 text-emerald-300" />
                      </div>

                      <p className="mt-5 text-lg font-semibold text-white">
                        AI Interviewer
                      </p>

                      <p className="mt-2 max-w-[180px] text-sm leading-6 text-slate-400">
                        Simulated interview flow with live response tracking
                      </p>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                        Listening
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-semibold">
                        Software Engineer Simulation
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Role-aware questions, feedback, and progress insights.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                      <Briefcase className="h-4 w-4 text-emerald-300" />
                      <p className="mt-2 text-xs text-slate-400">Type</p>
                      <p className="text-sm font-semibold text-white">Mixed</p>
                    </div>

                    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                      <BarChart3 className="h-4 w-4 text-emerald-300" />
                      <p className="mt-2 text-xs text-slate-400">
                        Difficulty
                      </p>
                      <p className="text-sm font-semibold text-white">
                        Medium
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>          
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.05)] backdrop-blur md:grid-cols-4">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-sm font-bold text-slate-950">
              Structured practice
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Clear flow from setup to feedback.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <Brain className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-sm font-bold text-slate-950">
              ML scoring
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Semantic answer evaluation.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <Target className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-sm font-bold text-slate-950">
              Challenges
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Technical and business cases.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <Trophy className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-sm font-bold text-slate-950">
              Progress dashboard
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Readiness and trend tracking.
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-6"
      >
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-slate-950 p-8 text-white lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                How it works
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
                From setup to feedback in one smooth flow.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-300">
                Upload or enter your profile, practice in a guided interview,
                complete challenges, and review your performance in the
                dashboard.
              </p>

              <Link href="/setup">
                <Button className="mt-8 rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700">
                  Start Practicing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-5 bg-slate-50 p-6 lg:grid-cols-3 lg:p-8">
              <Card className="group rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step 01
                  </p>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    Setup
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Add CV and job details so the interview feels role-aware and
                    relevant.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    CV + JD
                  </div>
                </CardContent>
              </Card>

              <Card className="group rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Play className="h-5 w-5" />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step 02
                  </p>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    Practice
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Answer realistic questions and complete practical interview
                    challenges.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    Live flow
                  </div>
                </CardContent>
              </Card>

              <Card className="group rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step 03
                  </p>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    Improve
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Get feedback, review scores, and track readiness in the
                    dashboard.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    Progress insights
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ML / Dashboard section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:p-10">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 hover:bg-emerald-50">
              <Brain className="mr-2 h-3.5 w-3.5" />
              Machine Learning Layer
            </Badge>

            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950">
              Not just questions. A learning system that tracks progress.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              InterviewPro combines answer-level ML evaluation with progress
              prediction. The dashboard uses saved attempts to estimate
              readiness, predict next score, and recommend targeted practice.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <Zap className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-4 font-black text-slate-950">
                  Semantic scoring
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compares user answers with expected answers using meaning, not
                  only keywords.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-4 font-black text-slate-950">
                  Progress prediction
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Uses past scores, trends, consistency, and difficulty to
                  estimate readiness.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-900 bg-slate-950 p-7 text-white shadow-[0_28px_70px_rgba(2,6,23,0.28)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-300">
                Dashboard Preview
              </p>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                ML Insight
              </span>
            </div>

            <div className="mt-7 rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Interview Readiness</p>
              <p className="mt-2 text-4xl font-black">Almost Ready</p>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div className="h-2 w-[72%] rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">Predicted Score</p>
                <p className="mt-2 text-3xl font-black">78/100</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">Trend</p>
                <p className="mt-2 text-3xl font-black">Improving</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Recommended Practice</p>
              <p className="mt-2 text-lg font-bold leading-7">
                Practice more system design and technical-depth challenges.
              </p>
            </div>

            <Link href="/dashboard">
              <Button className="mt-6 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
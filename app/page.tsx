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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.045),transparent_22%)]" />

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
              href="/dashboard"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Dashboard
            </Link>

            <Link
              href="/challenges"
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              Challenges
            </Link>
            
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" className="rounded-full bg-white">
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

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div className="max-w-2xl">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 hover:bg-emerald-50">
              {isSignedIn ? "Welcome back" : "AI-Powered Interview Coaching"}
            </Badge>

            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
              {isSignedIn
                ? `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}.`
                : "Have your best mock interview session."}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {isSignedIn
                ? "Continue your interview practice, review your progress, or start a new mock interview session."
                : "Practice realistic interviews tailored to your CV, target role, and job description. Answer questions, receive feedback, and improve like a real candidate preparing for a serious interview."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/setup">
                <Button className="h-12 rounded-full bg-emerald-600 px-6 text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] hover:bg-emerald-700">
                  {isSignedIn ? "Start Interview" : "Try it Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/preview">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-slate-200 bg-white/90 px-6 text-slate-700 hover:bg-white"
                >
                  See Preview
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">CV</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Grounded question generation
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">JD</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Role-aware interview flow
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">AI</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Feedback and follow-up practice
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="preview" className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute inset-0 rounded-[2.6rem] bg-emerald-500/12 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.6rem] border border-slate-800/90 bg-[linear-gradient(180deg,#081225_0%,#0f172a_52%,#111827_100%)] p-5 shadow-[0_28px_80px_rgba(2,6,23,0.38)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.09),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.06),transparent_22%)]" />

              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                  Live Interview Preview
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  Question 1 of 4
                </span>
              </div>

              <div className="relative mt-5 grid gap-4 md:grid-cols-[1.25fr_0.85fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/72 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Current Question
                    </p>

                    <h3 className="mt-3 text-[1.85rem] font-black leading-[1.05] tracking-tight text-white">
                      Can you describe a project where you used Python to build
                      a real application or solve a practical problem?
                    </h3>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/72 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Candidate Answer
                    </p>

                    <div className="mt-3 rounded-[1.25rem] border border-emerald-400/15 bg-slate-950/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <p className="text-sm leading-7 text-slate-300">
                        In one project, I built a backend service using Python
                        and FastAPI to handle interview question generation and
                        scoring logic...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/76 p-5">
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-950/80 text-center">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
                        <Mic className="relative h-8 w-8 text-emerald-300" />
                      </div>

                      <p className="mt-5 text-lg font-semibold text-white">
                        AI Interviewer
                      </p>
                      <p className="mt-2 max-w-[180px] text-sm leading-6 text-slate-400">
                        Avatar or webcam placeholder with speaking activity
                      </p>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                        Listening
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Briefcase className="h-4 w-4 text-emerald-300" />
                        <span className="text-xs">Interview Type</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">
                        Mixed
                      </p>
                    </div>

                    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <BarChart3 className="h-4 w-4 text-emerald-300" />
                        <span className="text-xs">Difficulty</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">
                        Medium
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/8 p-4">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Software Engineer Interview Simulation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-4"
      >
        <div className="rounded-[2.25rem] border border-slate-200/80 bg-white/75 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                How it Works
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                Practice interviews in three simple steps
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Build an interview experience with a clear setup flow,
                realistic live practice, and structured feedback pages that
                feel like a real product.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Setup
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  CV + JD based preparation
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Practice
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Guided interview flow
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Feedback
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Actionable improvement areas
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <Card className="group rounded-[1.75rem] border border-slate-200/80 bg-white/96 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  CV-Based Questions
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Generate interview questions grounded in the candidate’s
                  actual experience, projects, and technical background.
                </p>

                <div className="mt-5 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Grounded personalization
                </div>
              </CardContent>
            </Card>

            <Card className="group rounded-[1.75rem] border border-slate-200/80 bg-white/96 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Adaptive Interview Flow
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Move from setup into live interview practice with a smoother,
                  role-aware question flow and better session structure.
                </p>

                <div className="mt-5 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Live practice experience
                </div>
              </CardContent>
            </Card>

            <Card className="group rounded-[1.75rem] border border-slate-200/80 bg-white/96 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Feedback & Analysis
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Score answers and highlight strengths, communication gaps,
                  and areas where the candidate can improve next.
                </p>

                <div className="mt-5 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Actionable coaching
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
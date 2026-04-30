"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  Square,
  Sparkles,
  Briefcase,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

type InterviewType = "Technical" | "Behavioral" | "Mixed";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const questionSets: Record<InterviewType, string[]> = {
  Technical: [
    "Walk me through the architecture of a project you built, including the frontend, backend, database, and API flow.",
    "How would you optimize a slow database query or API endpoint in a production application?",
    "Explain a technical tradeoff you made between performance, maintainability, and development time.",
  ],
  Behavioral: [
    "Tell me about a time you had to handle a difficult project deadline or unexpected blocker.",
    "Describe a situation where you disagreed with a teammate and how you resolved it.",
    "Tell me about a time you received critical feedback and what you changed afterward.",
  ],
  Mixed: [
    "Describe a technical project you worked on and explain your personal contribution.",
    "What was the hardest technical or teamwork challenge in that project, and how did you handle it?",
    "If you rebuilt that project today, what would you improve in both the design and your process?",
  ],
};

const feedbackMap: Record<
  InterviewType,
  {
    score1Label: string;
    score1: string;
    score2Label: string;
    score2: string;
    score3Label: string;
    score3: string;
    strengths: string[];
    improvements: string[];
    summary: string;
  }
> = {
  Technical: {
    score1Label: "Technical Depth",
    score1: "8/10",
    score2Label: "Clarity",
    score2: "7/10",
    score3Label: "Problem Solving",
    score3: "8/10",
    strengths: [
      "You explained technical choices clearly.",
      "You showed awareness of implementation trade-offs.",
      "Your answers reflected solid project ownership.",
    ],
    improvements: [
      "Mention measurable technical outcomes.",
      "Explain architecture decisions more deeply.",
      "Be more specific about constraints and trade-offs.",
    ],
    summary:
      "This preview suggests a technically solid interview style. In the full interview, stronger design details and clearer trade-off analysis would make your answers even better.",
  },
  Behavioral: {
    score1Label: "Communication",
    score1: "8/10",
    score2Label: "Structure",
    score2: "8/10",
    score3Label: "Reflection",
    score3: "7/10",
    strengths: [
      "Your answers are easy to follow.",
      "You communicate challenges clearly and calmly.",
      "You show good self-awareness and reflection.",
    ],
    improvements: [
      "Use more concrete outcomes or results.",
      "Make your role in the story more explicit.",
      "End each answer with a stronger lesson learned.",
    ],
    summary:
      "This preview suggests strong behavioral interview potential. In the full interview, clearer ownership and stronger storytelling would strengthen your responses.",
  },
  Mixed: {
    score1Label: "Communication",
    score1: "8/10",
    score2Label: "Technical Clarity",
    score2: "7/10",
    score3Label: "Confidence",
    score3: "8/10",
    strengths: [
      "You balance technical and behavioral answers well.",
      "Your examples feel relevant and practical.",
      "Your overall answer flow is clear and professional.",
    ],
    improvements: [
      "Add more measurable impact to your examples.",
      "Explain technical choices more deeply.",
      "End answers with a stronger takeaway or reflection.",
    ],
    summary:
      "This preview suggests a balanced interview style. In the full interview, adding more technical reasoning and more concrete outcomes would strengthen your performance further.",
  },
};

export default function PreviewPage() {
  const [interviewType, setInterviewType] = useState<InterviewType>("Mixed");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const finalTranscriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const demoQuestions = useMemo(() => {
    return questionSets[interviewType];
  }, [interviewType]);

  const progressValue = ((currentQuestion + 1) / demoQuestions.length) * 100;

  const handleAnswerChange = (value: string) => {
    const updated = [...answers];
    updated[currentQuestion] = value;
    setAnswers(updated);
  };

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceError("Voice mode is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setVoiceError(
        event.error === "not-allowed"
          ? "Microphone permission was blocked."
          : "Voice mode stopped. Please try again.",
      );
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let newFinalPart = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          newFinalPart += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (newFinalPart) {
        finalTranscriptRef.current += newFinalPart;
      }

      handleAnswerChange(`${finalTranscriptRef.current}${interimTranscript}`.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Browser recognition may already be stopped.
      }
    };
  }, [currentQuestion]);

  const toggleVoiceMode = () => {
    if (!recognitionRef.current) {
      setVoiceError("Voice mode is not supported in this browser.");
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        return;
      }

      finalTranscriptRef.current = answers[currentQuestion]
        ? `${answers[currentQuestion]} `
        : "";
      recognitionRef.current.start();
    } catch {
      setVoiceError("Voice mode could not start. Please try again.");
    }
  };

  const handleNext = () => {
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowFeedback(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const feedbackContent = feedbackMap[interviewType];

  if (showFeedback) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.045),transparent_22%)]" />

        <header className="relative z-10 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xl font-black tracking-tight text-slate-950">
                InterviewPro
              </p>
              <p className="text-sm text-slate-500">Sample interview preview</p>
            </div>

            <Link href="/">
              <Button
                variant="outline"
                className="rounded-2xl border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back Home
              </Button>
            </Link>
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 hover:bg-emerald-50">
              {interviewType} Preview Feedback
            </Badge>

            <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
              Here’s how your sample interview could end
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              This feedback is tailored to the interview type you selected.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <CardContent className="p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-sm text-slate-500">{feedbackContent.score1Label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{feedbackContent.score1}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-sm text-slate-500">{feedbackContent.score2Label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{feedbackContent.score2}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-sm text-slate-500">{feedbackContent.score3Label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{feedbackContent.score3}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                      <h2 className="text-xl font-bold text-slate-950">Strengths</h2>
                    </div>

                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {feedbackContent.strengths.map((item) => (
                        <p key={item}>• {item}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-700" />
                      <h2 className="text-xl font-bold text-slate-950">Improvements</h2>
                    </div>

                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {feedbackContent.improvements.map((item) => (
                        <p key={item}>• {item}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6">
                  <h3 className="text-lg font-bold text-slate-950">Sample Summary</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feedbackContent.summary}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      setShowFeedback(false);
                      setCurrentQuestion(0);
                    }}
                    variant="outline"
                    className="h-12 rounded-2xl border-slate-200 bg-white px-5"
                  >
                    Back to Demo
                  </Button>

                  <Link href="/setup">
                    <Button className="h-12 rounded-2xl bg-emerald-600 px-5 text-white shadow-[0_8px_20px_rgba(5,150,105,0.22)] hover:bg-emerald-700">
                      Start Full Interview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[2rem] border border-slate-800/90 bg-[linear-gradient(180deg,#081225_0%,#0f172a_52%,#111827_100%)] text-white shadow-[0_28px_80px_rgba(2,6,23,0.30)]">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                        Demo Complete
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">{interviewType}</h3>
                    </div>

                    <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/10">
                      Finished
                    </Badge>
                  </div>

                  <div className="mt-6 rounded-[1.75rem] border border-slate-800 bg-slate-900/75 p-5">
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-950/80 text-center">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
                        <CheckCircle2 className="relative h-8 w-8 text-emerald-300" />
                      </div>

                      <p className="mt-5 text-lg font-semibold text-white">
                        Preview Completed
                      </p>
                      <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-400">
                        You’ve seen a {interviewType.toLowerCase()} interview flow and example feedback.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-6">
                  <p className="font-semibold text-slate-900">
                    What happens in the full version
                  </p>

                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <p>• You choose the interview style you want</p>
                    <p>• Questions become more personalized to your role</p>
                    <p>• Final feedback is based on your complete session</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.045),transparent_22%)]" />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black tracking-tight text-slate-950">
              InterviewPro
            </p>
            <p className="text-sm text-slate-500">Sample interview preview</p>
          </div>

          <Link href="/">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back Home
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl">
          <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 hover:bg-emerald-50">
            Interactive Product Preview
          </Badge>

          <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
            Preview the interview style you actually want
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Choose your interview type first, then try a short demo with matching
            questions so the preview feels closer to your real session.
          </p>
        </div>

        <div className="mt-8 max-w-xl">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Choose Interview Type
          </p>

          <div className="grid grid-cols-3 gap-3">
            {(["Technical", "Behavioral", "Mixed"] as InterviewType[]).map((item) => {
              const isActive = interviewType === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setInterviewType(item);
                    setAnswers(Array(questionSets[item].length).fill(""));
                    setCurrentQuestion(0);
                    setShowFeedback(false);
                  }}
                  className={`h-11 rounded-2xl border text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.22)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <CardContent className="p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 hover:bg-emerald-50">
                    {interviewType} Demo Session
                  </Badge>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    Question {currentQuestion + 1} of {demoQuestions.length}
                  </h2>

                  <p className="mt-2 text-base leading-7 text-slate-600">
                    This sample adapts to the interview style you selected.
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Preview Progress</span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-3" />
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Current Question
                </p>

                <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950">
                  {demoQuestions[currentQuestion]}
                </h3>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Your Answer
                  </label>
                  <span className="text-sm text-slate-500">
                    {answers[currentQuestion]?.length || 0} chars
                  </span>
                </div>

                <Textarea
                  value={answers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={`Type your ${interviewType.toLowerCase()} answer here to experience this interview style...`}
                  className="min-h-[220px] rounded-[1.75rem] border-slate-200 bg-white p-5 text-base leading-7 shadow-sm focus-visible:ring-emerald-200"
                />
                {voiceError ? (
                  <p className="text-sm text-rose-600">{voiceError}</p>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="h-12 rounded-2xl border-slate-200 bg-white px-5"
                >
                  Previous
                </Button>

                <Button
                  onClick={toggleVoiceMode}
                  className={`h-12 rounded-2xl px-5 text-white shadow-[0_8px_20px_rgba(5,150,105,0.22)] ${
                    isListening
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isListening ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Mic className="mr-2 h-4 w-4" />
                  )}
                  {isListening ? "Stop Voice" : "Demo Voice Mode"}
                </Button>

                <Button
                  onClick={handleNext}
                  className="h-12 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800"
                >
                  {currentQuestion === demoQuestions.length - 1
                    ? "See Sample Feedback"
                    : "Next Question"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border border-slate-800/90 bg-[linear-gradient(180deg,#081225_0%,#0f172a_52%,#111827_100%)] text-white shadow-[0_28px_80px_rgba(2,6,23,0.30)]">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      Live Preview
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">AI Interviewer</h3>
                  </div>

                  <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/10">
                    Active
                  </Badge>
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-slate-800 bg-slate-900/75 p-5">
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-950/80 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
                      <Mic className="relative h-8 w-8 text-emerald-300" />
                    </div>

                    <p className="mt-5 text-lg font-semibold text-white">
                      {interviewType} Interview Assistant
                    </p>
                    <p className="mt-2 max-w-[180px] text-sm leading-6 text-slate-400">
                      This preview now matches the interview type you selected.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase className="h-4 w-4 text-emerald-300" />
                      <span className="text-xs">Type</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{interviewType}</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/76 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <BarChart3 className="h-4 w-4 text-emerald-300" />
                      <span className="text-xs">Style</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">AI Generated</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/8 p-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {interviewType} interview simulation
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <CardContent className="p-6">
                <p className="font-semibold text-slate-900">What this preview shows</p>

                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <p>• A demo that matches the interview type you choose</p>
                  <p>• How question style changes between interview modes</p>
                  <p>• The answer input and sample feedback experience</p>
                </div>

                <Link href="/setup" className="mt-6 inline-block">
                  <Button className="h-12 rounded-2xl bg-emerald-600 px-5 text-white shadow-[0_8px_20px_rgba(5,150,105,0.22)] hover:bg-emerald-700">
                    Start Full Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

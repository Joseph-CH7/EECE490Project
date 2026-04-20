"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/voice";
import {
  ArrowLeft,
  Mic,
  Square,
  Trash2,
  Send,
  Briefcase,
  Clock3,
  Volume2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import InterviewCameraCoach from "@/components/ui/InterviewCameraCoach";

type Message = {
  role: "interviewer" | "candidate";
  text: string;
};

type SpeechRecognitionType = any;

export default function InterviewPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [interviewType, setInterviewType] = useState("Mixed");
  const [inferredCategory, setInferredCategory] = useState("Not available");
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTranscriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    const savedQuestions = localStorage.getItem("questions");
    const savedInterviewType = localStorage.getItem("interviewType");
    const savedCategory = localStorage.getItem("inferredCategory");

    if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
    if (savedInterviewType) setInterviewType(savedInterviewType);
    if (savedCategory) setInferredCategory(savedCategory.replace(/_/g, " "));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.log("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event?.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
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

      setAnswer(`${finalTranscriptRef.current}${interimTranscript}`.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Recognition cleanup error:", error);
      }
    };
  }, []);

  const currentQuestion =
    questions[currentQuestionIndex] || "No questions generated yet.";
  const displayedPrompt = followUpPrompt || currentQuestion;

  const progressValue = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  const speakText = async (text: string) => {
    if (!text.trim()) return;

    try {
      setIsInterviewerSpeaking(true);

      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition before TTS:", error);
        }
      }

      await speak(text);
    } catch (error) {
      console.error("TTS speak error:", error);
    } finally {
      setIsInterviewerSpeaking(false);
    }
  };

  const startInterview = async () => {
    if (!questions.length) return;

    finalTranscriptRef.current = "";
    setAnswer("");
    setFollowUpPrompt(null);

    const openingLine = `Welcome. Let's begin. ${questions[0]}`;

    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setConversation([{ role: "interviewer", text: openingLine }]);

    await speakText(openingLine);
  };

  const repeatQuestion = async () => {
    const lastInterviewerMessage = [...conversation]
      .reverse()
      .find((msg) => msg.role === "interviewer");

    if (lastInterviewerMessage) {
      await speakText(lastInterviewerMessage.text);
    } else if (currentQuestion) {
      await speakText(currentQuestion);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || isInterviewerSpeaking || isProcessing) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Speech recognition start error:", error);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error("Speech recognition stop error:", error);
    }
  };

  const submitAnswer = async () => {
    const currentAnswer = answer.trim();
    if (!currentAnswer) return;

    const updatedConversation: Message[] = [
      ...conversation,
      { role: "candidate", text: currentAnswer },
    ];

    setConversation(updatedConversation);
    setIsProcessing(true);

    try {
      if (followUpPrompt) {
        finalTranscriptRef.current = "";
        setAnswer("");
        setFollowUpPrompt(null);

        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          const nextQuestion = questions[nextIndex];
          const transitionReply = `Thanks. Let's move to the next question. ${nextQuestion}`;

          setCurrentQuestionIndex(nextIndex);

          const finalConversation: Message[] = [
            ...updatedConversation,
            { role: "interviewer", text: transitionReply },
          ];

          setConversation(finalConversation);
          await speakText(transitionReply);
        } else {
          const closingReply =
            "Nice work. That was the last question in this round. You can now review your feedback.";

          const finalConversation: Message[] = [
            ...updatedConversation,
            { role: "interviewer", text: closingReply },
          ];

          setConversation(finalConversation);
          await speakText(closingReply);
        }

        return;
      }

      const res = await fetch("/api/live-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: updatedConversation,
          currentQuestion,
          interviewType,
        }),
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", errorText);
        throw new Error(`Request failed with status ${res.status}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", text);
        throw new Error("API did not return JSON");
      }

      const data = await res.json();

      const interviewerReply =
        data.reply || "Can you give me a more specific example?";

      const finalConversation: Message[] = [
        ...updatedConversation,
        { role: "interviewer", text: interviewerReply },
      ];

      setConversation(finalConversation);
      setFollowUpPrompt(interviewerReply);

      finalTranscriptRef.current = "";
      setAnswer("");

      await speakText(interviewerReply);
    } catch (error) {
      console.error("Submit answer error:", error);

      const fallbackReply =
        "I had trouble generating the next follow-up question. Please try again.";

      setConversation([
        ...updatedConversation,
        { role: "interviewer", text: fallbackReply },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black tracking-tight">InterviewPro</p>
            <p className="text-sm text-slate-500">Live interview practice</p>
          </div>

          <Link href="/setup">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Setup
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="rounded-full bg-emerald-100 px-4 py-1 text-emerald-700 hover:bg-emerald-100">
              Practice Interview
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Question {questions.length ? currentQuestionIndex + 1 : 0} of {questions.length}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Answer clearly and focus on your own contribution, decisions, and outcomes.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Interview Progress</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-3" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                Please avoid refreshing or going backward during the interview session so your progress is not lost.
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Current Question
                </p>
                <h2 className="text-2xl font-bold leading-tight text-slate-950">
                  {displayedPrompt}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Interview Type</p>
                  <p className="mt-1 font-semibold text-slate-900">{interviewType}</p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm text-slate-500">Status</p>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">
                    {!interviewStarted
                      ? "Not started"
                      : isInterviewerSpeaking
                      ? "Interviewer speaking"
                      : isListening
                      ? "Listening"
                      : isProcessing
                      ? "Thinking"
                      : "Ready"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Your live answer transcript
                </label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Start speaking or type your answer here..."
                  className="min-h-[260px] rounded-3xl border-slate-200 p-4 text-base"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={startInterview}
                  disabled={!questions.length}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Interview
                </Button>

                <Button
                  className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={startListening}
                  disabled={!interviewStarted || isInterviewerSpeaking || isProcessing}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Answer
                </Button>

                <Button
                  className="rounded-2xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                  onClick={stopListening}
                  disabled={!isListening}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>

                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => setAnswer("")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>

                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={repeatQuestion}
                  disabled={!interviewStarted}
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Repeat
                </Button>

                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || isProcessing}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Answer
                </Button>

                <Link href="/feedback">
                  <Button variant="outline" className="rounded-2xl">
                    Go to Feedback
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 bg-slate-950 text-white shadow-sm">
            <CardContent className="flex h-full flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    AI Interviewer
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">Live Practice View</h3>
                </div>

                <Badge className="rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20">
                  Active Session
                </Badge>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                {isInterviewerSpeaking && "Interviewer is speaking now."}
                {!isInterviewerSpeaking && isListening && "Microphone is listening to your answer."}
                {!isInterviewerSpeaking &&
                  !isListening &&
                  isProcessing &&
                  "Interviewer is thinking about the next follow-up."}
                {!isInterviewerSpeaking &&
                  !isListening &&
                  !isProcessing &&
                  interviewStarted &&
                  "Ready for the next step."}
                {!interviewStarted && "Start the interview to begin the live conversation."}
              </div>

              <div className="flex-1 rounded-[1.75rem] border border-slate-800 bg-slate-900 p-5">
                <InterviewCameraCoach />

                <div className="mt-5 max-h-[260px] space-y-3 overflow-y-auto">
                  {conversation.length === 0 ? (
                    <div className="rounded-2xl bg-slate-800 p-4 text-slate-400">
                      The conversation will appear here.
                    </div>
                  ) : (
                    conversation.map((msg, index) => (
                      <div
                        key={index}
                        className={`rounded-2xl p-4 text-sm ${
                          msg.role === "interviewer"
                            ? "bg-slate-800 text-white"
                            : "ml-8 bg-emerald-600 text-white"
                        }`}
                      >
                        <p className="mb-1 text-xs uppercase tracking-[0.2em] opacity-70">
                          {msg.role === "interviewer" ? "Interviewer" : "You"}
                        </p>
                        <p>{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-slate-900 p-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-300" />
                    <p className="text-sm text-slate-400">Target Role</p>
                  </div>
                  <p className="mt-1 font-semibold capitalize">{inferredCategory}</p>
                </div>

                <div className="rounded-3xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Question Style</p>
                  <p className="mt-1 font-semibold">{interviewType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

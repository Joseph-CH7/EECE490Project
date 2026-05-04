"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { speak } from "@/lib/voice";
import { db } from "@/lib/firebase";
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
import type {
  InterviewFeedbackEntry,
  InterviewSessionFeedback,
  LiveInterviewFeedback,
  VisualMetrics,
} from "@/lib/interview-feedback";
import { buildSessionInterviewFeedback } from "@/lib/interview-feedback";

type Message = {
  role: "interviewer" | "candidate";
  text: string;
};

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

function normalizeQuestionKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(can you|could you|please|explain|describe|tell me about|what is|what are|how would|how do)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeQuestionList(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const text = value.trim();
    const key = normalizeQuestionKey(text);

    if (!text || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(text);
  }

  return deduped;
}

function weightedScore(mainScore: number, followUpScore: number) {
  return Number((mainScore * 0.7 + followUpScore * 0.3).toFixed(1));
}

function uniqueFeedbackItems(items: string[]) {
  return [...new Set(items.filter(Boolean))].slice(0, 4);
}

function combineQuestionFeedback(
  mainFeedback: LiveInterviewFeedback,
  followUpFeedback: LiveInterviewFeedback,
): LiveInterviewFeedback {
  return {
    ...mainFeedback,
    totalScore: Math.round(
      mainFeedback.totalScore * 0.7 + followUpFeedback.totalScore * 0.3,
    ),
    relevance: weightedScore(mainFeedback.relevance, followUpFeedback.relevance),
    keyword: weightedScore(mainFeedback.keyword, followUpFeedback.keyword),
    semantic: weightedScore(mainFeedback.semantic, followUpFeedback.semantic),
    delivery: weightedScore(mainFeedback.delivery, followUpFeedback.delivery),
    strengths: uniqueFeedbackItems([
      ...mainFeedback.strengths,
      ...followUpFeedback.strengths,
    ]),
    improvements: uniqueFeedbackItems([
      ...followUpFeedback.improvements,
      ...mainFeedback.improvements,
    ]),
    answerLength: mainFeedback.answerLength + followUpFeedback.answerLength,
    includesExample: mainFeedback.includesExample || followUpFeedback.includesExample,
    includesOutcome: mainFeedback.includesOutcome || followUpFeedback.includesOutcome,
    visualPresence: mainFeedback.visualPresence,
    visualMetrics: mainFeedback.visualMetrics,
    speechMetrics: mainFeedback.speechMetrics,
  };
}

export default function InterviewPage() {
  const { user } = useUser();
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
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [visualMetrics, setVisualMetrics] = useState<VisualMetrics | null>(null);

  const finalTranscriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const askedQuestionKeysRef = useRef<Set<string>>(new Set());
  const isSubmittingRef = useRef(false);
  const lastSavedInterviewDocIdRef = useRef<string | null>(null);
  const visualMetricsRef = useRef<VisualMetrics | null>(null);
  const currentSessionIdRef = useRef<string>("");
  const currentSessionNumberRef = useRef<number>(1);
  const listeningStartedAtRef = useRef<number | null>(null);
  const accumulatedListeningMsRef = useRef(0);

  const getUserStorageKey = (key: string) =>
    user?.id ? `${key}:${user.id}` : key;

  const handleVisualMetricsChange = (metrics: VisualMetrics) => {
    visualMetricsRef.current = metrics;
    setVisualMetrics(metrics);
  };

  const getCurrentVisualMetrics = () => {
    const metrics = visualMetricsRef.current || visualMetrics;
    return metrics && metrics.sampleCount > 0 ? metrics : null;
  };

  const resetSpeechTiming = () => {
    listeningStartedAtRef.current = null;
    accumulatedListeningMsRef.current = 0;
  };

  const getCurrentSpeechDurationSeconds = () => {
    const activeListeningMs = listeningStartedAtRef.current
      ? Date.now() - listeningStartedAtRef.current
      : 0;
    const totalMs = accumulatedListeningMsRef.current + activeListeningMs;

    return totalMs > 0 ? Math.round(totalMs / 100) / 10 : null;
  };

  const getNextSessionNumber = () => {
    if (typeof window === "undefined") return 1;

    const interviews = JSON.parse(localStorage.getItem(getUserStorageKey("interviews")) || "[]");
    const savedSessionNumbers = interviews
      .map((item: { sessionNumber?: unknown }) => Number(item.sessionNumber))
      .filter((value: number) => Number.isFinite(value) && value > 0);

    if (savedSessionNumbers.length) {
      return Math.max(...savedSessionNumbers) + 1;
    }

    return Math.floor(interviews.length / 4) + 1;
  };

  const persistSessionFeedback = (
    nextEntry: InterviewFeedbackEntry,
  ): InterviewSessionFeedback | null => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!currentSessionIdRef.current) {
      currentSessionIdRef.current = `interview-${Date.now()}`;
    }

    const savedEntries = localStorage.getItem(getUserStorageKey("interviewFeedbackEntries"));
    let entries: InterviewFeedbackEntry[] = [];

    if (savedEntries) {
      try {
        entries = JSON.parse(savedEntries) as InterviewFeedbackEntry[];
      } catch (error) {
        console.error("Could not parse saved interview feedback entries:", error);
      }
    }

    const sessionEntries = entries.filter(
      (entry) => entry.sessionId === currentSessionIdRef.current,
    );
    const questionNumber = sessionEntries.length + 1;
    const entryWithSession: InterviewFeedbackEntry = {
      ...nextEntry,
      sessionId: currentSessionIdRef.current,
      questionNumber,
    };
    const nextEntries = [...sessionEntries, entryWithSession];
    const sessionFeedback = buildSessionInterviewFeedback(nextEntries);

    localStorage.setItem(getUserStorageKey("interviewFeedbackEntries"), JSON.stringify(nextEntries));

    if (sessionFeedback) {
  localStorage.setItem(getUserStorageKey("interviewSessionFeedback"), JSON.stringify(sessionFeedback));
  localStorage.setItem("interviewSessionFeedback", JSON.stringify(sessionFeedback));

  // ✅ SAVE FOR DASHBOARD
  const interviews = JSON.parse(localStorage.getItem(getUserStorageKey("interviews")) || "[]");

  const savedInterview = {
    question: entryWithSession.question,
    answer: entryWithSession.answer,
    sessionId: currentSessionIdRef.current,
    sessionNumber: currentSessionNumberRef.current,
    questionNumber,
    score: entryWithSession.feedback.totalScore,
    feedback: entryWithSession.feedback,
    date: new Date().toISOString(),
    userId: user?.id || "guest",
    userEmail: user?.primaryEmailAddress?.emailAddress || "",
  };

  interviews.push(savedInterview);

  localStorage.setItem(getUserStorageKey("interviews"), JSON.stringify(interviews));

  localStorage.setItem(getUserStorageKey("latestInterviewFeedback"), JSON.stringify(sessionFeedback));
  localStorage.setItem("latestInterviewFeedback", JSON.stringify(sessionFeedback));

  if (user?.id) {
    addDoc(collection(db, "interviewResults"), {
      ...savedInterview,
      sessionFeedback,
      interviewType,
      category: inferredCategory,
      createdAt: serverTimestamp(),
    })
      .then((docRef) => {
        lastSavedInterviewDocIdRef.current = docRef.id;
      })
      .catch((error) => {
        console.error("Error saving interview result:", error);
      });
  }
}

    return sessionFeedback;
  };

  const persistFollowUpAnswer = (
    followUpQuestion: string,
    followUpAnswer: string,
    followUpFeedback: LiveInterviewFeedback | null,
  ): InterviewSessionFeedback | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedEntries = localStorage.getItem(getUserStorageKey("interviewFeedbackEntries"));
    let entries: InterviewFeedbackEntry[] = [];

    if (savedEntries) {
      try {
        entries = JSON.parse(savedEntries) as InterviewFeedbackEntry[];
      } catch (error) {
        console.error("Could not parse saved interview feedback entries:", error);
      }
    }

    const sessionEntries = entries.filter(
      (entry) => entry.sessionId === currentSessionIdRef.current,
    );

    if (!sessionEntries.length) {
      return null;
    }

    const updatedEntries = [...sessionEntries];
    const lastEntry = updatedEntries[updatedEntries.length - 1];

    const combinedFeedback = followUpFeedback
      ? combineQuestionFeedback(lastEntry.feedback, followUpFeedback)
      : lastEntry.feedback;

    updatedEntries[updatedEntries.length - 1] = {
      ...lastEntry,
      followUpQuestion,
      followUpAnswer,
      followUpFeedback: followUpFeedback || undefined,
      feedback: combinedFeedback,
    };

    const sessionFeedback = buildSessionInterviewFeedback(updatedEntries);
    localStorage.setItem(
      getUserStorageKey("interviewFeedbackEntries"),
      JSON.stringify(updatedEntries),
    );

    if (sessionFeedback) {
      localStorage.setItem(
        getUserStorageKey("interviewSessionFeedback"),
        JSON.stringify(sessionFeedback),
      );
      localStorage.setItem("interviewSessionFeedback", JSON.stringify(sessionFeedback));
      localStorage.setItem(
        getUserStorageKey("latestInterviewFeedback"),
        JSON.stringify(sessionFeedback),
      );
      localStorage.setItem("latestInterviewFeedback", JSON.stringify(sessionFeedback));
    }

    const savedInterviews = JSON.parse(localStorage.getItem(getUserStorageKey("interviews")) || "[]");

    if (savedInterviews.length) {
      const updatedInterviews = [...savedInterviews];
      const targetInterviewIndex = [...updatedInterviews]
        .reverse()
        .findIndex(
          (interview: { sessionId?: string; questionNumber?: number }) =>
            interview.sessionId === currentSessionIdRef.current &&
            Number(interview.questionNumber) === Number(lastEntry.questionNumber),
        );
      const resolvedIndex =
        targetInterviewIndex >= 0
          ? updatedInterviews.length - 1 - targetInterviewIndex
          : updatedInterviews.length - 1;
      const lastInterview = updatedInterviews[resolvedIndex];

      updatedInterviews[resolvedIndex] = {
        ...lastInterview,
        followUpQuestion,
        followUpAnswer,
        followUpFeedback: followUpFeedback || undefined,
        score: combinedFeedback.totalScore,
        feedback: combinedFeedback,
      };

      localStorage.setItem(
        getUserStorageKey("interviews"),
        JSON.stringify(updatedInterviews),
      );
    }

    if (user?.id && lastSavedInterviewDocIdRef.current) {
      updateDoc(doc(db, "interviewResults", lastSavedInterviewDocIdRef.current), {
        followUpQuestion,
        followUpAnswer,
        followUpFeedback: followUpFeedback || null,
        score: combinedFeedback.totalScore,
        feedback: combinedFeedback,
        sessionFeedback,
        updatedAt: serverTimestamp(),
      }).catch((error) => {
        console.error("Error updating interview follow-up result:", error);
      });
    }

    return sessionFeedback;
  };

  useEffect(() => {
    const savedQuestions = localStorage.getItem("questions");
    const savedInterviewType = localStorage.getItem("interviewType");
    const savedCategory = localStorage.getItem("inferredCategory");

    if (savedQuestions) setQuestions(dedupeQuestionList(JSON.parse(savedQuestions)));
    if (savedInterviewType) setInterviewType(savedInterviewType);
    if (savedCategory) setInferredCategory(savedCategory.replace(/_/g, " "));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.log("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (!listeningStartedAtRef.current) {
        listeningStartedAtRef.current = Date.now();
      }
      setIsListening(true);
    };

    recognition.onend = () => {
      if (listeningStartedAtRef.current) {
        accumulatedListeningMsRef.current += Date.now() - listeningStartedAtRef.current;
        listeningStartedAtRef.current = null;
      }
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event?.error);
      setIsListening(false);
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
    resetSpeechTiming();
    currentSessionIdRef.current = `interview-${Date.now()}`;
    currentSessionNumberRef.current = getNextSessionNumber();
    askedQuestionKeysRef.current = new Set([normalizeQuestionKey(questions[0])]);
    setAnswer("");
    setFollowUpPrompt(null);
    setInterviewComplete(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("currentInterviewSessionId", currentSessionIdRef.current);
      localStorage.setItem(
        getUserStorageKey("currentInterviewSessionId"),
        currentSessionIdRef.current,
      );
      localStorage.removeItem("latestInterviewAnswer");
      localStorage.removeItem("latestInterviewQuestion");
      localStorage.removeItem("latestInterviewReply");
      localStorage.removeItem("latestInterviewFeedback");
      localStorage.removeItem("interviewFeedbackEntries");
      localStorage.removeItem("interviewSessionFeedback");
      localStorage.removeItem(getUserStorageKey("latestInterviewFeedback"));
      localStorage.removeItem(getUserStorageKey("interviewFeedbackEntries"));
      localStorage.removeItem(getUserStorageKey("interviewSessionFeedback"));
    }

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
    if (isSubmittingRef.current) return;

    const currentAnswer = answer.trim();
    if (!currentAnswer) return;

    isSubmittingRef.current = true;
    const updatedConversation: Message[] = [
      ...conversation,
      { role: "candidate", text: currentAnswer },
    ];

    setConversation(updatedConversation);
    setIsProcessing(true);

    try {
      if (followUpPrompt) {
        let followUpFeedback: LiveInterviewFeedback | null = null;
        const speechDurationSeconds = getCurrentSpeechDurationSeconds();

        try {
          const followUpRes = await fetch("/api/live-interview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversation: updatedConversation,
              currentQuestion: followUpPrompt,
              interviewType,
              visualMetrics: getCurrentVisualMetrics(),
              speechDurationSeconds,
            }),
          });

          if (followUpRes.ok) {
            const followUpData = await followUpRes.json();
            followUpFeedback =
              (followUpData.feedback || null) as LiveInterviewFeedback | null;
          } else {
            console.error("Follow-up scoring failed:", await followUpRes.text());
          }
        } catch (error) {
          console.error("Follow-up scoring failed:", error);
        }

        persistFollowUpAnswer(followUpPrompt, currentAnswer, followUpFeedback);

        finalTranscriptRef.current = "";
        resetSpeechTiming();
        setAnswer("");
        setFollowUpPrompt(null);

        let nextIndex = currentQuestionIndex + 1;

        while (
          nextIndex < questions.length &&
          askedQuestionKeysRef.current.has(normalizeQuestionKey(questions[nextIndex]))
        ) {
          nextIndex += 1;
        }

        if (nextIndex < questions.length) {
          const nextQuestion = questions[nextIndex];
          const transitionReply = `Thanks. Let's move to the next question. ${nextQuestion}`;

          askedQuestionKeysRef.current.add(normalizeQuestionKey(nextQuestion));
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
          setInterviewComplete(true);
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
          visualMetrics: getCurrentVisualMetrics(),
          speechDurationSeconds: getCurrentSpeechDurationSeconds(),
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
      const feedback = (data.feedback || null) as LiveInterviewFeedback | null;

      finalTranscriptRef.current = "";
      resetSpeechTiming();
      setAnswer("");

      if (typeof window !== "undefined" && feedback) {
        const entry: InterviewFeedbackEntry = {
          question: currentQuestion,
          answer: currentAnswer,
          feedback,
        };
        const sessionFeedback = persistSessionFeedback(entry);

        localStorage.setItem("latestInterviewAnswer", currentAnswer);
        localStorage.setItem("latestInterviewQuestion", currentQuestion);
        localStorage.setItem("latestInterviewReply", interviewerReply);
        localStorage.setItem(
          "latestInterviewFeedback",
          JSON.stringify(sessionFeedback || feedback),
        );
      }

      if (data.noFollowUp) {
        let nextIndex = currentQuestionIndex + 1;

        while (
          nextIndex < questions.length &&
          askedQuestionKeysRef.current.has(normalizeQuestionKey(questions[nextIndex]))
        ) {
          nextIndex += 1;
        }

        if (nextIndex < questions.length) {
          const nextQuestion = questions[nextIndex];
          const transitionReply = `Good answer. Let's move to the next question. ${nextQuestion}`;
          const finalConversation: Message[] = [
            ...updatedConversation,
            { role: "interviewer", text: transitionReply },
          ];

          askedQuestionKeysRef.current.add(normalizeQuestionKey(nextQuestion));
          setCurrentQuestionIndex(nextIndex);
          setConversation(finalConversation);
          setFollowUpPrompt(null);
          await speakText(transitionReply);
        } else {
          const closingReply =
            "Nice work. That was the last question in this round. You can now review your feedback.";
          const finalConversation: Message[] = [
            ...updatedConversation,
            { role: "interviewer", text: closingReply },
          ];

          setConversation(finalConversation);
          setFollowUpPrompt(null);
          setInterviewComplete(true);
          await speakText(closingReply);
        }

        return;
      }

      const finalConversation: Message[] = [
        ...updatedConversation,
        { role: "interviewer", text: interviewerReply },
      ];

      setConversation(finalConversation);
      setFollowUpPrompt(interviewerReply);

      await speakText(interviewerReply);
    } catch (error) {
      console.error("Submit answer error:", error);

      const fallbackReply =
        "Thanks. I captured your answer, but I could not score this response right now. Please try submitting again or move to the next question.";

      setConversation([
        ...updatedConversation,
        { role: "interviewer", text: fallbackReply },
      ]);
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
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
                      : interviewComplete
                      ? "Complete"
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
                  disabled={interviewComplete}
                  className="min-h-[260px] rounded-3xl border-slate-200 p-4 text-base"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {!interviewStarted ? (
                  <Button
                    className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={startInterview}
                    disabled={!questions.length}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="rounded-2xl"
                    disabled
                  >
                    Interview Started
                  </Button>
                )}

                <Button
                  className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={startListening}
                  disabled={!interviewStarted || interviewComplete || isInterviewerSpeaking || isProcessing}
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
                  disabled={interviewComplete}
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
                  className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || isProcessing || interviewComplete}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Answer
                </Button>

                <Link href="/feedback">
                  <Button
                    variant={interviewComplete ? "default" : "outline"}
                    className={
                      interviewComplete
                        ? "rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                        : "rounded-2xl"
                    }
                  >
                    {interviewComplete ? "Review Feedback" : "Go to Feedback"}
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
                <InterviewCameraCoach
                  trackingActive={interviewStarted && !interviewComplete}
                  onMetricsChange={handleVisualMetricsChange}
                />

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

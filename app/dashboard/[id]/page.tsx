"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SavedQuestion = {
  question: string;
  answer: string;
  sessionId?: string;
  sessionNumber?: number;
  questionNumber?: number;
  followUpQuestion?: string;
  followUpAnswer?: string;
  followUpFeedback?: {
    totalScore?: number;
  };
  score: number;
  feedback: {
    strengths?: string[];
    improvements?: string[];
    followUp?: string;
  };
  date: string;
};

function getDateValue(date?: string) {
  if (!date) return 0;
  const parsed = new Date(date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getChronologicalReviewTitle(items: SavedQuestion[], index: number) {
  const item = items[index];
  if (!item) return "Question Review";

  const chronological = items
    .map((savedItem, originalIndex) => ({ ...savedItem, originalIndex }))
    .sort((a, b) => getDateValue(a.date) - getDateValue(b.date));
  const chronologicalIndex = chronological.findIndex(
    (savedItem) => savedItem.originalIndex === index,
  );
  const safeIndex = chronologicalIndex >= 0 ? chronologicalIndex : index;
  const sessionKeys: string[] = [];
  let displaySessionNumber = 1;

  chronological.forEach((savedItem, itemIndex) => {
    const key = savedItem.sessionId || `legacy:${Math.floor(itemIndex / 4) + 1}`;

    if (!sessionKeys.includes(key)) {
      sessionKeys.push(key);
    }

    if (savedItem.originalIndex === index) {
      displaySessionNumber = sessionKeys.indexOf(key) + 1;
    }
  });
  const questionNumber = Number(item.questionNumber) || (safeIndex % 4) + 1;

  return `Interview ${displaySessionNumber} - Question ${questionNumber}`;
}

export default function QuestionReviewPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user, isLoaded } = useUser();

  const [item, setItem] = useState<SavedQuestion | null>(null);
  const [title, setTitle] = useState("Question Review");

  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = user?.id ? `interviews:${user.id}` : "interviews";
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setItem(saved[id] || null);
    setTitle(getChronologicalReviewTitle(saved, id));
  }, [id, isLoaded, user?.id]);

  if (!item) {
    return <p className="p-10">Question not found.</p>;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mt-6 rounded-3xl border-slate-200 bg-white">
          <CardContent className="space-y-6 p-8">
            <h1 className="text-3xl font-black">{title}</h1>

            <div>
              <p className="text-sm font-semibold text-slate-500">Question</p>
              <p className="mt-2 text-lg font-medium">{item.question}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">Your Answer</p>
              <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">Score</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">
                {item.score}/100
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">Strengths</p>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {item.feedback?.strengths?.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Improvements
              </p>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {item.feedback?.improvements?.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            {item.followUpQuestion && (
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Follow-up Question
                </p>
                <p className="mt-2 text-slate-700">{item.followUpQuestion}</p>
              </div>
            )}

            {item.followUpQuestion && item.followUpAnswer && (
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Follow-up Answer
                </p>
                <p className="mt-2 text-slate-700">{item.followUpAnswer}</p>
                {item.followUpFeedback?.totalScore ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Follow-up score: {item.followUpFeedback.totalScore}/100
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

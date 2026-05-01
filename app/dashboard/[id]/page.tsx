"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SavedQuestion = {
  question: string;
  answer: string;
  score: number;
  feedback: {
    strengths?: string[];
    improvements?: string[];
    followUp?: string;
  };
  date: string;
};

export default function QuestionReviewPage() {
  const params = useParams();
  const id = Number(params.id);

  const [item, setItem] = useState<SavedQuestion | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("interviews") || "[]");
    setItem(saved[id] || null);
  }, [id]);

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
            <h1 className="text-3xl font-black">Question Review</h1>

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

            {item.feedback?.followUp && (
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Follow-up Question
                </p>
                <p className="mt-2 text-slate-700">{item.feedback.followUp}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
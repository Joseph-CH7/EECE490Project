"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SavedChallenge = {
  title: string;
  major: string;
  type: string;
  score: number;
  level: string;
  feedback: string;
  answer: string;
  sampleAnswer: string;
  missingPoints?: any[];
  coveredPoints?: any[];
  date: string;
};

import { use } from "react";

export default function ChallengeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoaded } = useUser();
  const [challenge, setChallenge] = useState<SavedChallenge | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = user?.id ? `challenges:${user.id}` : "challenges";
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setChallenge(saved[Number(id)] || null);
}, [id, isLoaded, user?.id]);

  if (!challenge) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full bg-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="mt-8 rounded-3xl">
            <CardContent className="p-8">
              <h1 className="text-2xl font-black">Challenge not found</h1>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full bg-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mt-8 rounded-3xl border-slate-200 bg-white">
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {challenge.major} · {challenge.type}
                </p>
                <h1 className="mt-2 text-4xl font-black text-slate-950">
                  {challenge.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {new Date(challenge.date).toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-5 py-3 text-right">
                <p className="text-sm text-slate-700">Score</p>
                <p className="text-3xl font-black text-slate-700">
                  {challenge.score}/100
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-sm text-slate-300">Evaluation</p>
              <h2 className="mt-1 text-2xl font-black">{challenge.level}</h2>
              <p className="mt-3 text-slate-200">{challenge.feedback}</p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold">Your Answer</h2>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 whitespace-pre-wrap">
                {challenge.answer}
              </div>
            </div>

            {challenge.coveredPoints && challenge.coveredPoints.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold">Covered Points</h2>
                <div className="mt-3 space-y-3">
                  {challenge.coveredPoints.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"
                    >
                      <CheckCircle className="text-green-700" />
                      <p className="text-sm text-green-900">
                        {item.point || item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challenge.missingPoints && challenge.missingPoints.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold">Missing Points</h2>
                <div className="mt-3 space-y-3">
                  {challenge.missingPoints.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
                    >
                      <XCircle className="text-red-700" />
                      <p className="text-sm text-red-900">
                        {item.point || item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-bold">Sample Strong Answer</h2>
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 leading-7">
                {challenge.sampleAnswer}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

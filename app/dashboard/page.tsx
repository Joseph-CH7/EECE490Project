"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  History,
  LineChart,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

type Interview = {
  id?: string;
  question?: string;
  answer?: string;
  sessionId?: string;
  sessionNumber?: number;
  questionNumber?: number;
  followUpQuestion?: string;
  followUpAnswer?: string;
  score: number;
  date?: string;
  feedback?: any;
  userId?: string;
};

type InterviewRow = Interview & {
  originalIndex: number;
  displaySessionNumber: number;
  displayQuestionNumber: number;
  sessionKey: string;
};

type Challenge = {
  id?: string;
  challengeId?: number;
  title?: string;
  major?: string;
  type?: string;
  score: number;
  level?: string;
  feedback?: string;
  date?: string;
  usedML?: boolean;
  qualitySimilarity?: number;
  relevanceSimilarity?: number;
  testedSkills?: string[];
  difficulty?: number;
  answer?: string;
  sampleAnswer?: string;
  userId?: string;
};

type Attempt = {
  source: "Interview" | "Challenge";
  title: string;
  score: number;
  date?: string;
  skills: string[];
  difficulty: number;
};

type ProgressInsights = {
  readinessLevel: string;
  readinessReason: string;
  predictedNextScore: number | "—";
  trend: string;
  trendChange: number;
  averageScore: number;
  recentAverage: number;
  olderAverage: number;
  consistency: string;
  strongestSkill: string;
  weakestSkill: string;
  strongestScore: number;
  weakestScore: number;
  recommendation: string;
  hasData: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(numbers: number[]) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function getDateValue(date?: string) {
  if (!date) return 0;
  const parsed = new Date(date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(date?: string) {
  if (!date) return "Completed session";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

function getProgressBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

function getReadinessTheme(score: number | "—") {
  const numericScore = typeof score === "number" ? score : 0;

  if (numericScore >= 80) {
    return {
      panel: "bg-emerald-950",
      icon: "bg-emerald-400/10 text-emerald-300",
      label: "text-emerald-300",
    };
  }

  if (numericScore >= 60) {
    return {
      panel: "bg-amber-950",
      icon: "bg-amber-400/10 text-amber-300",
      label: "text-amber-300",
    };
  }

  return {
    panel: "bg-rose-950",
    icon: "bg-rose-400/10 text-rose-300",
    label: "text-rose-300",
  };
}

function getSkillInsights(attempts: Attempt[]) {
  const skillMap: Record<string, { total: number; count: number }> = {};

  attempts.forEach((attempt) => {
    attempt.skills.forEach((skill) => {
      if (!skillMap[skill]) {
        skillMap[skill] = { total: 0, count: 0 };
      }

      skillMap[skill].total += attempt.score;
      skillMap[skill].count += 1;
    });
  });

  const skills = Object.entries(skillMap).map(([skill, value]) => ({
    skill,
    averageScore: Math.round(value.total / value.count),
    attempts: value.count,
  }));

  if (!skills.length) {
    return {
      strongestSkill: "Not enough data yet",
      weakestSkill: "Not enough data yet",
      strongestScore: 0,
      weakestScore: 0,
    };
  }

  const sortedByScore = [...skills].sort(
    (a, b) => b.averageScore - a.averageScore
  );

  return {
    strongestSkill: sortedByScore[0].skill,
    weakestSkill: sortedByScore[sortedByScore.length - 1].skill,
    strongestScore: sortedByScore[0].averageScore,
    weakestScore: sortedByScore[sortedByScore.length - 1].averageScore,
  };
}

function getProgressInsights(
  interviews: Interview[],
  challenges: Challenge[]
): ProgressInsights {
  const interviewAttempts: Attempt[] = interviews.map((interview, index) => ({
    source: "Interview",
    title: `Interview ${index + 1}`,
    score: Number(interview.score) || 0,
    date: interview.date,
    skills: ["Communication", "Answer Structure", "Interview Readiness"],
    difficulty: 3,
  }));

  const challengeAttempts: Attempt[] = challenges.map((challenge, index) => ({
    source: "Challenge",
    title: challenge.title || `Challenge ${index + 1}`,
    score: Number(challenge.score) || 0,
    date: challenge.date,
    skills:
      challenge.testedSkills && challenge.testedSkills.length > 0
        ? challenge.testedSkills
        : [
            challenge.major || "General Reasoning",
            challenge.type || "Problem Solving",
          ],
    difficulty: challenge.difficulty || 3,
  }));

  const attempts = [...interviewAttempts, ...challengeAttempts]
    .filter((attempt) => Number.isFinite(attempt.score))
    .sort((a, b) => getDateValue(a.date) - getDateValue(b.date));

  if (attempts.length === 0) {
    return {
      hasData: false,
      readinessLevel: "Start Practicing",
      readinessReason:
        "Complete interviews and challenges to unlock progress insights.",
      predictedNextScore: "—",
      trend: "No trend yet",
      trendChange: 0,
      averageScore: 0,
      recentAverage: 0,
      olderAverage: 0,
      consistency: "No data yet",
      strongestSkill: "Not enough data yet",
      weakestSkill: "Not enough data yet",
      strongestScore: 0,
      weakestScore: 0,
      recommendation: "Complete your first challenge or interview.",
    };
  }

  const scores = attempts.map((attempt) => attempt.score);
  const averageScore = Math.round(average(scores));

  const midpoint = Math.max(1, Math.floor(attempts.length / 2));
  const olderAttempts = attempts.slice(0, midpoint);
  const recentAttempts = attempts.slice(midpoint);

  const olderAverage = Math.round(
    average(olderAttempts.map((attempt) => attempt.score))
  );

  const recentAverage = recentAttempts.length
    ? Math.round(average(recentAttempts.map((attempt) => attempt.score)))
    : averageScore;

  const trendChange = recentAverage - olderAverage;

  let trend = "Stable";

  if (attempts.length < 2) {
    trend = "Not enough attempts yet";
  } else if (trendChange >= 8) {
    trend = "Strongly Improving";
  } else if (trendChange >= 3) {
    trend = "Improving";
  } else if (trendChange <= -8) {
    trend = "Dropping";
  } else if (trendChange <= -3) {
    trend = "Needs Consistency";
  }

  const scoreVariance = average(
    scores.map((score) => Math.pow(score - averageScore, 2))
  );

  const scoreStandardDeviation = Math.sqrt(scoreVariance);

  let consistency = "Very consistent";

  if (scoreStandardDeviation >= 18) {
    consistency = "Inconsistent";
  } else if (scoreStandardDeviation >= 10) {
    consistency = "Moderately consistent";
  }

  const improvementBoost = attempts.length >= 2 ? trendChange * 0.45 : 0;
  const consistencyPenalty = scoreStandardDeviation >= 18 ? 4 : 0;

  const predictedNextScore = Math.round(
    clamp(recentAverage + improvementBoost - consistencyPenalty, 0, 100)
  );

  let readinessLevel = "Needs Practice";
  let readinessReason =
    "Your results show that you need more practice before interview readiness.";

  if (averageScore >= 88 && predictedNextScore >= 85) {
    readinessLevel = "Strong Candidate";
    readinessReason =
      "Your average score and predicted next score are both strong.";
  } else if (averageScore >= 78 && predictedNextScore >= 75) {
    readinessLevel = "Interview Ready";
    readinessReason =
      "Your performance is strong enough for realistic interview preparation.";
  } else if (averageScore >= 62 || predictedNextScore >= 65) {
    readinessLevel = "Almost Ready";
    readinessReason =
      "You are improving, but some areas still need targeted practice.";
  }

  const skillInsights = getSkillInsights(attempts);

  let recommendation = "Complete more challenges to unlock better guidance.";

  if (
    attempts.length >= 2 &&
    skillInsights.weakestSkill !== "Not enough data yet"
  ) {
    recommendation = `Practice more ${skillInsights.weakestSkill} tasks next. This is currently your weakest area.`;
  }

  if (trend === "Dropping" || trend === "Needs Consistency") {
    readinessReason =
      "Your overall progress is close, but recent attempts dropped. Focus on consistency and clearer answers next.";
    recommendation =
      "Repeat one medium-difficulty challenge and focus on clearer structure, examples, and complete reasoning.";
  }

  return {
    hasData: true,
    readinessLevel,
    readinessReason,
    predictedNextScore,
    trend,
    trendChange,
    averageScore,
    recentAverage,
    olderAverage,
    consistency,
    strongestSkill: skillInsights.strongestSkill,
    weakestSkill: skillInsights.weakestSkill,
    strongestScore: skillInsights.strongestScore,
    weakestScore: skillInsights.weakestScore,
    recommendation,
  };
}

function StatCard({
  title,
  value,
  icon,
  score,
  subtitle,
  accent = "emerald",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  score?: number;
  subtitle?: string;
  accent?: "emerald" | "blue" | "slate" | "amber";
}) {
  const accentClasses = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {value}
            </h3>
          </div>

          <div className={`rounded-2xl p-3 ${accentClasses[accent]}`}>
            {icon}
          </div>
        </div>

        {typeof score === "number" && (
          <div className="mt-5">
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(score)}`}
                style={{ width: `${clamp(score, 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function normalizeFirestoreDate(value: any) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return undefined;
}

function normalizeIdentityText(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getInterviewDedupeKey(interview: Interview) {
  const questionNumber = Number(interview.questionNumber);

  if (interview.sessionId && Number.isFinite(questionNumber) && questionNumber > 0) {
    return `session:${interview.sessionId}:q:${questionNumber}`;
  }

  const sessionNumber = Number(interview.sessionNumber);
  if (
    Number.isFinite(sessionNumber) &&
    sessionNumber > 0 &&
    Number.isFinite(questionNumber) &&
    questionNumber > 0
  ) {
    return [
      "numbered",
      sessionNumber,
      questionNumber,
      normalizeIdentityText(interview.question),
      normalizeIdentityText(interview.answer),
    ].join(":");
  }

  return [
    "legacy",
    getDateValue(interview.date),
    Number(interview.score) || 0,
    normalizeIdentityText(interview.question),
    normalizeIdentityText(interview.answer),
  ].join(":");
}

function dedupeInterviews(items: Interview[]) {
  const byKey = new Map<string, Interview>();

  items.forEach((item) => {
    const key = getInterviewDedupeKey(item);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, item);
      return;
    }

    const existingHasFollowUp = Boolean(existing.followUpQuestion || existing.followUpAnswer);
    const itemHasFollowUp = Boolean((item as any).followUpQuestion || (item as any).followUpAnswer);

    if ((!existingHasFollowUp && itemHasFollowUp) || (!existing.id && item.id)) {
      byKey.set(key, item);
    }
  });

  return [...byKey.values()];
}

function dedupeByIdentity<T extends { id?: string; date?: string; score?: number }>(
  items: T[],
) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const key = item.id || `${item.date || "no-date"}-${item.score ?? "no-score"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function buildInterviewRows(interviews: Interview[]): InterviewRow[] {
  const chronological = interviews
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => getDateValue(a.date) - getDateValue(b.date));

  return chronological.map((interview, chronologicalIndex) => {
    const displaySessionNumber = Math.floor(chronologicalIndex / 4) + 1;
    const displayQuestionNumber = (chronologicalIndex % 4) + 1;

    return {
      ...interview,
      sessionKey: `display:${displaySessionNumber}`,
      displaySessionNumber,
      displayQuestionNumber,
    };
  });
}

function getInterviewSessionCount(interviews: Interview[]) {
  return new Set(buildInterviewRows(interviews).map((row) => row.sessionKey)).size;
}

function getInterviewSessionKey(
  interview: Interview & { originalIndex: number },
  chronologicalIndex: number,
) {
  if (interview.sessionId) return `id:${interview.sessionId}`;

  return `legacy:${Math.floor(chronologicalIndex / 4) + 1}`;
}

function getLatestTwoSessionQuestions(interviews: Interview[]) {
  const rows = buildInterviewRows(interviews);
  const sessionNumbers = [...new Set(rows.map((row) => row.displaySessionNumber))]
    .sort((a, b) => b - a)
    .slice(0, 2);

  return rows
    .filter((row) => sessionNumbers.includes(row.displaySessionNumber))
    .sort((a, b) => {
      if (a.displaySessionNumber !== b.displaySessionNumber) {
        return b.displaySessionNumber - a.displaySessionNumber;
      }

      return a.displayQuestionNumber - b.displayQuestionNumber;
    });
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadDashboardData() {
      if (!user?.id) {
        setInterviews([]);
        setChallenges([]);
        return;
      }

      const localInterviews = JSON.parse(
        localStorage.getItem(`interviews:${user.id}`) || "[]",
      );
      const localChallenges = JSON.parse(
        localStorage.getItem(`challenges:${user.id}`) || "[]",
      );
      const cleanLocalInterviews = dedupeInterviews(localInterviews);

      setInterviews(cleanLocalInterviews);
      setChallenges(localChallenges);
      localStorage.setItem(`interviews:${user.id}`, JSON.stringify(cleanLocalInterviews));

      try {
        const [interviewSnapshot, challengeSnapshot] = await Promise.all([
          getDocs(
            query(
              collection(db, "interviewResults"),
              where("userId", "==", user.id),
            ),
          ),
          getDocs(
            query(
              collection(db, "challengeResults"),
              where("userId", "==", user.id),
            ),
          ),
        ]);

        const dbInterviews = interviewSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            score: Number(data.score) || 0,
            date: normalizeFirestoreDate(data.date) || normalizeFirestoreDate(data.createdAt),
          } as Interview;
        });

        const dbChallenges = challengeSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            score: Number(data.score) || 0,
            date: normalizeFirestoreDate(data.date) || normalizeFirestoreDate(data.createdAt),
          } as Challenge;
        });

        const mergedInterviews = dedupeInterviews([...dbInterviews, ...cleanLocalInterviews]);
        const mergedChallenges = dedupeByIdentity([...dbChallenges, ...localChallenges]);

        setInterviews(mergedInterviews);
        setChallenges(mergedChallenges);

        localStorage.setItem(`interviews:${user.id}`, JSON.stringify(mergedInterviews));
        localStorage.setItem(`challenges:${user.id}`, JSON.stringify(mergedChallenges));
      } catch (error) {
        console.error("Could not load dashboard data from Firebase:", error);
        const fallbackInterviews = JSON.parse(localStorage.getItem(`interviews:${user.id}`) || "[]");
        setInterviews(dedupeInterviews(fallbackInterviews));
        setChallenges(JSON.parse(localStorage.getItem(`challenges:${user.id}`) || "[]"));
      }
    }

    loadDashboardData();
  }, [isLoaded, user?.id]);

  const bestInterviewScore = interviews.length
    ? Math.max(...interviews.map((i) => Number(i.score)))
    : "—";

  const averageInterviewScore = interviews.length
    ? Math.round(
        interviews.reduce(
          (total, interview) => total + Number(interview.score),
          0
        ) / interviews.length
      )
    : "—";

  const bestChallengeScore = challenges.length
    ? Math.max(...challenges.map((c) => Number(c.score)))
    : "—";

  const averageChallengeScore = challenges.length
    ? Math.round(
        challenges.reduce(
          (total, challenge) => total + Number(challenge.score),
          0
        ) / challenges.length
      )
    : "—";

  const interviewSessionCount = getInterviewSessionCount(interviews);

  const progressInsights = useMemo(
    () => getProgressInsights(interviews, challenges),
    [interviews, challenges]
  );

  const latestInterviews = getLatestTwoSessionQuestions(interviews);

  const latestChallenges = [...challenges]
    .map((challenge, index) => ({ ...challenge, originalIndex: index }))
    .sort((a, b) => getDateValue(b.date) - getDateValue(a.date))
    .slice(0, 5);

  const totalAttempts = interviews.length + challenges.length;
  const readinessTheme = getReadinessTheme(progressInsights.predictedNextScore);

  const trendIcon =
    progressInsights.trend === "Dropping" ||
    progressInsights.trend === "Needs Consistency" ? (
      <TrendingDown className="h-5 w-5" />
    ) : (
      <TrendingUp className="h-5 w-5" />
    );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Coach Dashboard
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Your Progress Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Review your interviews, completed challenges, progress trend,
                readiness prediction, and recommended next practice area.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back Home
                </Button>
              </Link>

              <Link href="/challenges">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Challenges
                </Button>
              </Link>

              <Link href="/setup">
                <Button className="w-full rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700 sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Start Interview
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* AI Progress Insights */}
        <section className="mt-6">
          <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                {/* Left dark panel */}
                <div className={`${readinessTheme.panel} p-8 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className={`rounded-2xl p-4 ${readinessTheme.icon}`}>
                      <Brain className="h-7 w-7" />
                    </div>

                    <div>
                      <p className={`text-sm font-semibold ${readinessTheme.label}`}>
                        Progress Insights
                      </p>
                      <h2 className="mt-1 text-3xl font-black">
                        {progressInsights.readinessLevel}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300">
                    {progressInsights.readinessReason}
                  </p>

                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-medium text-slate-400">
                      Recommended Practice
                    </p>

                    <h3 className="mt-3 text-2xl font-black leading-9 text-white">
                      {progressInsights.recommendation}
                    </h3>
                  </div>
                </div>

                {/* Right white panel */}
                <div className="grid gap-5 bg-slate-50 p-8 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-500">
                        Predicted Next Score
                      </p>

                      <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="mt-4 text-4xl font-black text-slate-950">
                      {progressInsights.predictedNextScore}
                      {progressInsights.predictedNextScore !== "—" ? "/100" : ""}
                    </h3>

                    {progressInsights.predictedNextScore !== "—" && (
                      <div className="mt-5 h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${getProgressBarColor(
                            Number(progressInsights.predictedNextScore)
                          )}`}
                          style={{
                            width: `${clamp(
                              Number(progressInsights.predictedNextScore),
                              0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-500">
                        Progress Trend
                      </p>

                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        {trendIcon}
                      </div>
                    </div>

                    <h3 className="mt-4 text-3xl font-black text-slate-950">
                      {progressInsights.trend}
                    </h3>

                    <p className="mt-3 text-sm text-slate-500">
                      Recent average:{" "}
                      <span className="font-bold text-slate-900">
                        {progressInsights.hasData
                          ? `${progressInsights.recentAverage}/100`
                          : "—"}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      Strongest Skill
                    </p>

                    <h3 className="mt-3 text-2xl font-black text-emerald-700">
                      {progressInsights.strongestSkill}
                    </h3>

                    {progressInsights.hasData && (
                      <>
                        <p className="mt-3 text-sm text-slate-500">
                          Average skill score:{" "}
                          <span className="font-bold text-slate-900">
                            {progressInsights.strongestScore}/100
                          </span>
                        </p>

                        <div className="mt-4 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{
                              width: `${clamp(progressInsights.strongestScore, 0, 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      Weakest Skill
                    </p>

                    <h3
                      className={`mt-3 text-2xl font-black ${getScoreTextColor(
                        progressInsights.weakestScore,
                      )}`}
                    >
                      {progressInsights.weakestSkill}
                    </h3>

                    {progressInsights.hasData && (
                      <>
                        <p className="mt-3 text-sm text-slate-500">
                          Average skill score:{" "}
                          <span className="font-bold text-slate-900">
                            {progressInsights.weakestScore}/100
                          </span>
                        </p>

                        <div className="mt-4 h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${getProgressBarColor(
                              progressInsights.weakestScore,
                            )}`}
                            style={{
                              width: `${clamp(progressInsights.weakestScore, 0, 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Interview Sessions"
            value={interviewSessionCount}
            icon={<BarChart3 className="h-5 w-5" />}
            subtitle={`${interviews.length} scored questions saved`}
            accent="emerald"
          />

          <StatCard
            title="Average Question Score"
            value={averageInterviewScore}
            icon={<History className="h-5 w-5" />}
            score={
              typeof averageInterviewScore === "number"
                ? averageInterviewScore
                : undefined
            }
            subtitle={
              typeof bestInterviewScore === "number"
                ? `Best question score: ${bestInterviewScore}/100`
                : "Complete an interview to calculate this"
            }
            accent="emerald"
          />

          <StatCard
            title="Challenges Completed"
            value={challenges.length}
            icon={<Target className="h-5 w-5" />}
            subtitle="Saved practice challenge attempts"
            accent="blue"
          />

          <StatCard
            title="Average Challenge Score"
            value={averageChallengeScore}
            icon={<BookOpen className="h-5 w-5" />}
            score={
              typeof averageChallengeScore === "number"
                ? averageChallengeScore
                : undefined
            }
            subtitle={
              typeof bestChallengeScore === "number"
                ? `Best challenge score: ${bestChallengeScore}/100`
                : "Complete a challenge to calculate this"
            }
            accent="blue"
          />
        </section>

        {/* Recent Lists */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent Interviews */}
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Recent Interviews
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest saved interview sessions
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              {latestInterviews.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-semibold text-slate-700">
                    No interviews saved yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Complete your first real-time interview and your results
                    will appear here.
                  </p>

                  <Link href="/setup">
                    <Button className="mt-5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                      Start Interview
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 max-h-[520px] space-y-3 overflow-y-auto pr-2">
                  {latestInterviews.map((interview, index) => {
                    const originalIndex = interview.originalIndex;
                    const score = Number(interview.score) || 0;

                    return (
                      <Link
                        href={`/dashboard/${originalIndex}`}
                        key={`${interview.date}-${index}`}
                        className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-800">
                              Interview {interview.displaySessionNumber} - Question{" "}
                              {interview.displayQuestionNumber}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(interview.date)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className={`text-xl font-black ${scoreColor(score)}`}>
                              {score}/100
                            </p>
                            <p className="text-xs text-slate-500">
                              View feedback
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 rounded-full bg-white">
                          <div
                            className={`h-2 rounded-full ${getProgressBarColor(
                              score
                            )}`}
                            style={{ width: `${clamp(score, 0, 100)}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Challenges */}
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Completed Challenges
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest saved challenge attempts
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>

              {latestChallenges.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-semibold text-slate-700">
                    No completed challenges yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Complete your first challenge and your results will appear
                    here.
                  </p>

                  <Link href="/challenges">
                    <Button className="mt-5 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                      Practice Challenges
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {latestChallenges.map((challenge, index) => {
                    const originalIndex = challenge.originalIndex;
                    const score = Number(challenge.score) || 0;

                    return (
                      <Link
                        href={`/challenges/${originalIndex}`}
                        key={`${challenge.date}-${index}`}
                        className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <div className="flex justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black text-slate-800">
                                {challenge.title || `Challenge ${originalIndex + 1}`}
                              </h3>

                              {challenge.usedML && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                                  <Zap className="h-3 w-3" />
                                  ML
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                              {challenge.major || "Practice Challenge"}
                              {challenge.type ? ` · ${challenge.type}` : ""}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(challenge.date)}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className={`text-xl font-black ${scoreColor(score)}`}>
                              {score}/100
                            </p>
                            <p className="text-sm text-slate-500">
                              {challenge.level || "Completed"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 rounded-full bg-white">
                          <div
                            className={`h-2 rounded-full ${getProgressBarColor(
                              score
                            )}`}
                            style={{ width: `${clamp(score, 0, 100)}%` }}
                          />
                        </div>

                        {challenge.testedSkills &&
                          challenge.testedSkills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {challenge.testedSkills.slice(0, 4).map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                        {challenge.feedback && (
                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                            {challenge.feedback}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

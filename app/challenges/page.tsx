"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Home,
  ArrowLeft,
  Play,
  Trophy,
  Clock,
  Briefcase,
  Star,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

const challenges = [
  {
    id: 1,
    title: "Debug a Broken Expense Tracker",
    major: "Computer Engineering",
    difficulty: 3,
    type: "Technical Interview",
    time: "7 min",
    description: "Fix bugs in a real-world expense tracking system.",
    prompt:
      "You are given a simple expense tracker used by small businesses. Users report that totals are incorrect after deleting an expense, duplicate entries sometimes appear, and the page becomes slow after many entries.",
    code: `function addExpense(expenses, newExpense) {
  expenses.push(newExpense);
  return expenses;
}

function getTotal(expenses) {
  let total = 0;
  for (let i in expenses) {
    total += expenses[i].amount;
  }
  return total;
}`,
    tasks: [
      "Identify the main issues in the code and explain how you would improve it.",
    ],
    rubric: [
      {
        point: "Mentions mutation caused by expenses.push",
        keywords: ["push", "mutation", "mutate", "immutable"],
      },
      {
        point: "Mentions duplicate expense prevention",
        keywords: ["duplicate", "id", "unique"],
      },
      {
        point: "Uses reduce or proper loop for total",
        keywords: ["reduce", "total", "sum"],
      },
      {
        point: "Mentions scalability or performance",
        keywords: ["performance", "scalability", "memoization", "pagination"],
      },
    ],
    sampleAnswer:
      "The issue is that addExpense mutates the original expenses array using push, which can cause state bugs in React. A better approach is to return a new array: return [...expenses, newExpense]. Duplicate entries should be prevented by checking if an expense with the same id already exists. getTotal can be improved using reduce: expenses.reduce((sum, expense) => sum + expense.amount, 0). For scalability, the app should use unique IDs, pagination for large lists, memoized totals, validation, and possibly backend aggregation for very large datasets.",
    testedSkills: ["Debugging", "Clean Code", "Scalability"],
  },
  {
    id: 2,
    title: "Design a Mock Interview Database",
    major: "Computer Engineering",
    difficulty: 4,
    type: "System Design",
    time: "10 min",
    description: "Choose the right database design for an interview platform.",
    prompt:
      "You are building a platform with users, challenges, submissions, scores, and leaderboards.",
    tasks: [
      "Choose the best database approach and explain your design for users, submissions, scores, and leaderboards.",
    ],
    rubric: [
      {
        point: "Chooses SQL with clear reasoning",
        keywords: ["sql", "relational", "postgres", "mysql"],
      },
      {
        point: "Includes users, challenges, submissions, and scores",
        keywords: ["users", "challenges", "submissions", "scores"],
      },
      {
        point: "Mentions indexes or optimization",
        keywords: ["index", "indexes", "optimization", "query"],
      },
      {
        point: "Mentions consistency for leaderboard",
        keywords: ["consistency", "transaction", "leaderboard", "cache"],
      },
    ],
    sampleAnswer:
      "I would use SQL because the platform has structured relationships between users, challenges, submissions, and scores. Main tables would include users, challenges, submissions, scores, and leaderboard_entries. Submissions would reference users and challenges using foreign keys. For 100k users, I would add indexes on user_id, challenge_id, and score, paginate results, and cache leaderboard queries. To keep leaderboard data consistent, score updates should happen inside transactions, and cached leaderboard data should be refreshed after valid submissions.",
    testedSkills: ["Database Design", "Trade-offs", "Consistency"],
  },
  {
    id: 3,
    title: "Inflation Shock Analysis",
    major: "Economics",
    difficulty: 3,
    type: "Policy Case",
    time: "10 min",
    description: "Analyze the impact of inflation on the economy.",
    prompt:
      "Inflation rises from 3% to 12% in one year. The government is concerned about purchasing power, business costs, and public pressure.",
    tasks: [
      "Analyze the impact of the inflation shock and recommend an appropriate policy response.",
    ],
    rubric: [
      {
        point: "Explains reduced consumer purchasing power",
        keywords: ["consumers", "purchasing power", "prices", "real income"],
      },
      {
        point: "Explains higher business costs",
        keywords: ["businesses", "costs", "wages", "inputs"],
      },
      {
        point: "Mentions winners and losers",
        keywords: ["benefit", "lose", "debtors", "savers"],
      },
      {
        point: "Gives central bank recommendation",
        keywords: ["central bank", "interest rates", "monetary policy"],
      },
    ],
    sampleAnswer:
      "A rise in inflation from 3% to 12% reduces consumers’ purchasing power because wages may not increase as fast as prices. Businesses face higher input, wage, and financing costs, which can reduce margins or force them to raise prices. Debtors may benefit if debt is fixed in nominal terms, while savers and people on fixed incomes lose. The central bank may need to raise interest rates to reduce demand and control inflation, but this risks slowing growth and increasing unemployment.",
    testedSkills: ["Macroeconomics", "Policy Thinking", "Trade-offs"],
  },
  {
    id: 4,
    title: "Central Bank Interest Rate Decision",
    major: "Economics",
    difficulty: 4,
    type: "Economic Case",
    time: "15 min",
    description: "Make a policy recommendation using economic indicators.",
    prompt:
      "A country has inflation at 8%, unemployment is rising, and GDP growth is slowing.",
    tasks: [
      "Recommend whether the central bank should raise, lower, or keep rates unchanged, and justify your decision.",
    ],
    rubric: [
      {
        point: "Recognizes inflation-growth trade-off",
        keywords: ["trade-off", "inflation", "growth", "unemployment"],
      },
      {
        point: "Discusses raising rates",
        keywords: ["raise", "interest rates", "tighten"],
      },
      {
        point: "Mentions risk of recession or unemployment",
        keywords: ["recession", "unemployment", "slowdown"],
      },
      {
        point: "Gives a clear recommendation",
        keywords: ["recommend", "decision", "therefore"],
      },
    ],
    sampleAnswer:
      "The central bank faces a difficult trade-off. Inflation is high at 8%, which supports raising interest rates. However, unemployment is rising and GDP growth is slowing, so aggressive tightening could worsen the slowdown. I would recommend a cautious rate increase or holding rates temporarily while signaling readiness to act if inflation persists. The main risk of raising rates is higher unemployment and recession, while the main risk of not raising rates is inflation becoming entrenched.",
    testedSkills: ["Monetary Policy", "Reasoning", "Decision Making"],
  },
  {
    id: 5,
    title: "Budget Forecasting Case",
    major: "Finance",
    difficulty: 3,
    type: "Finance Assessment",
    time: "12 min",
    description: "Forecast next year’s profit using basic assumptions.",
    prompt:
      "A company has revenue of $1,000,000, costs of $700,000, and expected revenue growth of 10%. Assume costs grow by 6%.",
    tasks: [
      "Forecast next year’s profit and explain the assumptions and risks behind your calculation.",
    ],
    rubric: [
      {
        point: "Calculates revenue correctly",
        keywords: ["1,100,000", "1100000", "revenue"],
      },
      {
        point: "Calculates costs correctly",
        keywords: ["742,000", "742000", "cost"],
      },
      {
        point: "Calculates profit correctly",
        keywords: ["358,000", "358000", "profit"],
      },
      {
        point: "Mentions assumptions and risks",
        keywords: ["assumption", "risk", "growth", "costs"],
      },
    ],
    sampleAnswer:
      "Next year revenue is $1,000,000 × 1.10 = $1,100,000. Next year costs are $700,000 × 1.06 = $742,000. Expected profit is $1,100,000 - $742,000 = $358,000. The main assumptions are that revenue grows by 10%, costs grow by 6%, and there are no major changes in pricing, demand, or operations. Risks include lower demand, higher supplier costs, inflation, currency changes, and unexpected operating expenses.",
    testedSkills: ["Forecasting", "Profit Analysis", "Assumptions"],
  },
  {
    id: 6,
    title: "Company Valuation Challenge",
    major: "Finance",
    difficulty: 4,
    type: "Valuation Case",
    time: "9 min",
    description: "Estimate company value using a revenue multiple.",
    prompt:
      "You are valuing a startup with $2M revenue, 20% growth, and an industry multiple of 5x revenue.",
    tasks: [
      "Estimate the company valuation and explain whether you would invest.",
    ],
    rubric: [
      {
        point: "Calculates valuation correctly",
        keywords: ["10m", "10 million", "10,000,000", "valuation"],
      },
      {
        point: "Mentions growth as value driver",
        keywords: ["growth", "revenue", "market"],
      },
      {
        point: "Mentions risks or downside factors",
        keywords: ["risk", "profitability", "competition", "cash flow"],
      },
      {
        point: "Gives investment recommendation",
        keywords: ["invest", "recommend", "would"],
      },
    ],
    sampleAnswer:
      "Using a 5x revenue multiple, the valuation is $2M × 5 = $10M. The valuation could increase if the startup has strong growth, high margins, recurring revenue, a large addressable market, and strong customer retention. It could decrease if growth slows, competition increases, profitability is weak, or cash flow is negative. I would invest only if the company has a clear path to profitability and strong evidence that 20% growth can continue.",
    testedSkills: ["Valuation", "Investment Thinking", "Risk Analysis"],
  },
  {
    id: 7,
    title: "Market Entry Strategy",
    major: "Business",
    difficulty: 4,
    type: "Consulting Case",
    time: "15 min",
    description: "Decide whether a company should enter a new market.",
    prompt:
      "A Lebanese company wants to expand into a new country. Management asks you to assess whether this is a good idea.",
    tasks: [
      "Give a go or no-go recommendation and justify it using market, competition, cost, regulation, and risk analysis.",
    ],
    rubric: [
      {
        point: "Analyzes market size and demand",
        keywords: ["market size", "demand", "customers"],
      },
      {
        point: "Analyzes competitors",
        keywords: ["competition", "competitors", "market share"],
      },
      {
        point: "Mentions costs and regulation",
        keywords: ["costs", "regulation", "legal", "tax"],
      },
      {
        point: "Gives go/no-go recommendation",
        keywords: ["go", "no-go", "recommend", "enter"],
      },
    ],
    sampleAnswer:
      "I would assess market size, customer demand, competition, entry costs, regulations, and operational feasibility. If the target country has strong demand, manageable competition, acceptable regulations, and reasonable setup costs, entry may be attractive. If the market is small, heavily regulated, or dominated by strong competitors, I would recommend no-go. Key risks include regulatory barriers, currency risk, cultural differences, high customer acquisition costs, and operational execution.",
    testedSkills: ["Strategy", "Consulting Logic", "Market Analysis"],
  },
  {
    id: 8,
    title: "Customer Churn Diagnosis",
    major: "Business",
    difficulty: 3,
    type: "Business Case",
    time: "15 min",
    description: "Find out why customers are leaving a subscription app.",
    prompt:
      "A subscription app is losing users. Churn increased from 5% to 14% in three months.",
    tasks: [
      "Diagnose the likely causes of churn and recommend how to reduce it.",
    ],
    rubric: [
      {
        point: "Identifies possible churn reasons",
        keywords: ["price", "quality", "competitor", "user experience"],
      },
      {
        point: "Mentions data to check",
        keywords: ["data", "cohort", "feedback", "usage"],
      },
      {
        point: "Suggests solutions",
        keywords: ["solution", "retention", "discount", "onboarding"],
      },
      {
        point: "Mentions measurement",
        keywords: ["measure", "churn rate", "retention", "conversion"],
      },
    ],
    sampleAnswer:
      "Churn may be increasing because of pricing, poor user experience, weak onboarding, missing features, better competitors, or low perceived value. I would check cohort retention, usage frequency, cancellation reasons, customer feedback, support tickets, and competitor changes. Solutions could include improving onboarding, offering targeted retention discounts, fixing major product pain points, and creating re-engagement campaigns. Success should be measured by lower churn rate, higher retention, increased usage, and improved customer satisfaction.",
    testedSkills: ["Problem Solving", "Analytics", "Business Judgment"],
  },
  {
    id: 9,
    title: "Campaign Performance Audit",
    major: "Marketing",
    difficulty: 3,
    type: "Marketing Case",
    time: "12 min",
    description: "Analyze why a campaign has impressions but low conversions.",
    prompt:
      "A campaign received high impressions and clicks, but very low conversions. The marketing team wants recommendations.",
    tasks: [
      "Explain why conversions may be low and recommend how to improve campaign performance.",
    ],
    rubric: [
      {
        point: "Explains conversion problem",
        keywords: ["conversion", "landing page", "audience", "offer"],
      },
      {
        point: "Mentions metrics",
        keywords: ["ctr", "cpc", "conversion rate", "bounce rate"],
      },
      {
        point: "Suggests improvements",
        keywords: ["improve", "targeting", "copy", "landing page"],
      },
      {
        point: "Mentions testing",
        keywords: ["a/b test", "test", "experiment"],
      },
    ],
    sampleAnswer:
      "High impressions and clicks but low conversions may mean the ad attracts attention but the landing page, offer, targeting, or checkout flow is weak. I would review CTR, CPC, conversion rate, bounce rate, landing page speed, audience segments, and funnel drop-off. Improvements could include better targeting, stronger ad copy, clearer call-to-action, improved landing page design, and a more relevant offer. I would test changes using A/B testing and compare conversion rates across versions.",
    testedSkills: ["Marketing Analytics", "Conversion", "Testing"],
  },
  {
    id: 10,
    title: "Choose Storage for Inventory Thumbnails",
    major: "Computer Engineering",
    difficulty: 3,
    type: "System Design",
    time: "10 min",
    description: "Choose the best storage option for image thumbnails.",
    prompt:
      "You received an email from a colleague asking for the best storage solution for image thumbnails of inventory items. Options include flat-file store, relational database, key-value data store, Elasticsearch, and cloud file store. Which option is most effective and why?",
    options: [
      "Flat-file store",
      "Relational database",
      "Key-value data store",
      "Elasticsearch",
      "Cloud file store",
    ],
    tasks: [
      "Choose the most effective storage option and explain why it is suitable for image thumbnails.",
    ],
    rubric: [
      {
        point: "Chooses cloud file store",
        keywords: ["cloud file store", "s3", "amazon s3", "object storage"],
      },
      {
        point: "Explains image/file storage suitability",
        keywords: ["images", "thumbnails", "files", "objects"],
      },
      {
        point: "Mentions scalability and durability",
        keywords: ["scalable", "scalability", "durable", "reliable"],
      },
      {
        point: "Mentions cost or access speed",
        keywords: ["cheap", "cost", "fast", "retrieved", "access"],
      },
    ],
    sampleAnswer:
      "The most effective option is a cloud file store, such as Amazon S3. Image thumbnails are files, so storing them as objects in cloud storage is more suitable than putting binary files directly inside a relational database. A cloud file store is scalable, durable, cost-effective, and allows fast retrieval through URLs or APIs. A relational database can store metadata such as item ID, image URL, and upload date, but the actual thumbnail files should be stored in object storage. Flat-file storage is harder to scale and manage, key-value stores are not ideal for file management, and Elasticsearch is better for search rather than storing image files.",
    testedSkills: ["System Design", "Storage Choice", "Cloud Architecture"],
  },
  {
    id: 11,
    title: "Migrate 10 PB Across Continents",
    major: "Computer Engineering",
    difficulty: 4,
    type: "Cloud Architecture",
    time: "15 min",
    description: "Choose the fastest way to migrate petabyte-scale data.",
    prompt:
      "Which option will likely ensure the minimum transfer time when migrating 10 PB of data from one data center to another in a different continent?",
    tasks: ["Choose the best option and justify your answer."],
    options: [
      "Use a new dedicated internet connection",
      "Store data on an external device and transport it",
      "Transfer compressed data via FTP",
      "Transfer encrypted compressed data via VPN",
    ],
    rubric: [
      {
        point: "Chooses physical device shipping",
        keywords: [
          "external device",
          "ship",
          "shipping",
          "airship",
          "physical",
          "snowball",
        ],
      },
      {
        point: "Explains network transfer is too slow for 10 PB",
        keywords: ["10 pb", "petabyte", "months", "years", "network", "internet"],
      },
      {
        point: "Mentions AWS Snowball or storage appliance",
        keywords: ["aws snowball", "snowball", "appliance", "edge storage"],
      },
      {
        point: "Mentions time efficiency",
        keywords: ["minimum transfer time", "fastest", "time-saving", "efficient"],
      },
    ],
    sampleAnswer:
      "The best option is to store the data on an external physical device and transport it by airship. For 10 PB of data, transferring over the internet, FTP, or VPN would take a very long time even with a strong connection. A practical approach is to use a physical data transfer appliance such as AWS Snowball or Snowball Edge, load the data onto the device, ship it to the destination or cloud provider, and then import it. This is usually much faster and more practical for petabyte-scale migration.",
    testedSkills: ["Cloud Migration", "Data Transfer", "System Design"],
  },
];

function evaluateAnswer(answer: string, challenge: any) {
  
  const lowerAnswer = answer.toLowerCase();

  const results = challenge.rubric.map((item: any) => {
    const matched = item.keywords.some((keyword: string) =>
      lowerAnswer.includes(keyword.toLowerCase())
    );

    return {
      point: item.point,
      matched,
    };
  });

  const matchedCount = results.filter((item: any) => item.matched).length;
  const rubricScore = (matchedCount / challenge.rubric.length) * 70;

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  let detailScore = 0;
  if (wordCount >= 120) detailScore = 20;
  else if (wordCount >= 70) detailScore = 14;
  else if (wordCount >= 35) detailScore = 8;
  else detailScore = 3;

  const structureScore =
    answer.includes("\n") ||
    answer.includes("1.") ||
    answer.includes("-") ||
    answer.includes(":")
      ? 10
      : 3;

  const totalScore = Math.min(
    100,
    Math.round(rubricScore + detailScore + structureScore)
  );

  const missingPoints = results.filter((item: any) => !item.matched);

  let level = "Needs Improvement";
  let feedback =
    "Your answer is too general. Add more structure, more reasoning, and cover the missing points.";

  if (totalScore >= 85) {
    level = "Excellent";
    feedback =
      "Strong answer. You covered the main points clearly and structured your response well.";
  } else if (totalScore >= 70) {
    level = "Good";
    feedback =
      "Good answer. You covered many important points, but you can improve by adding more detail or addressing the missing areas.";
  } else if (totalScore >= 50) {
    level = "Fair";
    feedback =
      "Fair attempt. You understood part of the case, but your answer needs stronger analysis and clearer coverage of the rubric.";
  }

  return {
    score: totalScore,
    level,
    feedback,
    results,
    missingPoints,
    wordCount,
    usedML: false,
  };
}

export default function ChallengesPage() {
  const { user } = useUser();
  const [selectedMajor, setSelectedMajor] = useState("All");
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0]);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);

  const majors = [
    "All",
    "Computer Engineering",
    "Economics",
    "Finance",
    "Business",
    "Marketing",
  ];

  const filteredChallenges =
    selectedMajor === "All"
      ? challenges
      : challenges.filter((challenge) => challenge.major === selectedMajor);

  // Timer countdown
useEffect(() => {
  if (!activeChallenge || submitted || timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [activeChallenge, submitted, timeLeft]);
async function saveChallengeResult(savedChallenge: any) {
  // Keep localStorage so dashboard can still work locally
  const oldChallenges = JSON.parse(localStorage.getItem("challenges") || "[]");

  localStorage.setItem(
    "challenges",
    JSON.stringify([savedChallenge, ...oldChallenges])
  );

  // Also save to Firebase for real dashboard persistence
  if (!user) return;

  await addDoc(collection(db, "challengeResults"), {
    ...savedChallenge,
    userId: user.id,
    userEmail: user.primaryEmailAddress?.emailAddress || "",
    createdAt: serverTimestamp(),
  });
}

// When time ends
  useEffect(() => {
    if (!activeChallenge || submitted || timeLeft !== 0) return;

    setTimeExpired(true);

    if (answer.trim().length >= 20) {
      submitAnswer(true);
    } else {
      setSubmitted(true);
      setEvaluation({
        score: 0,
        level: "Time's Up",
        feedback:
          "Time expired before a valid answer was submitted. Your answer needs at least 20 characters to be evaluated.",
        results: [],
        missingPoints: [],
        wordCount: answer.trim().split(/\s+/).filter(Boolean).length,
        usedML: false,
      });
    }
  }, [timeLeft]);

  function startChallenge(challenge: any) {
  setActiveChallenge(challenge);
  setSelectedChallenge(challenge);
  setAnswer("");
  setSubmitted(false);
  setEvaluation(null);
  setTimeExpired(false);

  const minutes = Number(challenge.time.replace(" min", ""));
  setTimeLeft(minutes * 60);

  window.scrollTo({ top: 0, behavior: "smooth" });
}
  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
    <Clock size={16} />
    Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
  </div>
  async function submitAnswer(autoSubmitted = false) {
    if (!activeChallenge || answer.trim().length < 20) return;

    setIsEvaluating(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: activeChallenge.prompt,
          expected_answer: activeChallenge.sampleAnswer,
          user_answer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error("ML evaluation failed");
      }

      const result = await response.json();

      const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

      const evaluationResult = {
        score: result.score,
        level: result.label,
        feedback: result.feedback,
        quality_similarity: result.quality_similarity,
        relevance_similarity: result.relevance_similarity,
        results: [],
        missingPoints: [],
        wordCount,
        usedML: true,
      };

      const savedChallenge = {
        challengeId: activeChallenge.id,
        title: activeChallenge.title,
        major: activeChallenge.major,
        type: activeChallenge.type,
        score: evaluationResult.score,
        level: evaluationResult.level,
        feedback: evaluationResult.feedback,
        answer,
        sampleAnswer: activeChallenge.sampleAnswer,
        qualitySimilarity: evaluationResult.quality_similarity,
        relevanceSimilarity: evaluationResult.relevance_similarity,
        testedSkills: activeChallenge.testedSkills,
        difficulty: activeChallenge.difficulty,
        autoSubmitted: Boolean(autoSubmitted),
        timeExpired: Boolean(timeExpired),
        usedML: true,
        date: new Date().toISOString(),
      };

      await saveChallengeResult(savedChallenge);

      setEvaluation(evaluationResult);
      setSubmitted(true);
    } catch (error) {
      console.error("ML service unavailable. Using fallback evaluator:", error);

      const fallbackResult = evaluateAnswer(answer, activeChallenge);

      const savedChallenge = {
        challengeId: activeChallenge.id,
        title: activeChallenge.title,
        major: activeChallenge.major,
        type: activeChallenge.type,
        score: fallbackResult.score,
        level: fallbackResult.level,
        feedback: fallbackResult.feedback,
        answer,
        sampleAnswer: activeChallenge.sampleAnswer,
        missingPoints: fallbackResult.missingPoints || [],
        coveredPoints:
          fallbackResult.results?.filter((item: any) => item.matched) || [],
        testedSkills: activeChallenge.testedSkills,
        difficulty: activeChallenge.difficulty,
        autoSubmitted: Boolean(autoSubmitted),
        timeExpired: Boolean(timeExpired),
        usedML: false,
        date: new Date().toISOString(),
      };

      await saveChallengeResult(savedChallenge);

      setEvaluation(fallbackResult);
      setSubmitted(true);
    } finally {
      setIsEvaluating(false);
    }
  }

  function retryChallenge() {
    setAnswer("");
    setSubmitted(false);
    setEvaluation(null);
    setTimeExpired(false);

    if (activeChallenge) {
      const minutes = Number(activeChallenge.time.replace(" min", ""));
      setTimeLeft(minutes * 60);
    }
  }

  if (activeChallenge) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] text-slate-950 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setActiveChallenge(null)}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-950"
            >
              <ArrowLeft size={18} />
              Back to Challenges
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-950"
            >
              <Home size={18} />
              Back Home
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full">
                  {activeChallenge.major}
                </span>
                <h1 className="text-4xl font-black mt-4">
                  {activeChallenge.title}
                </h1>
                <p className="text-slate-600 mt-3">
                  {activeChallenge.type} · {activeChallenge.time}
                </p>
                <div
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    timeLeft <= 10
                      ? "bg-red-100 text-red-800 animate-pulse"
                      : timeLeft <= 60
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Clock size={16} />
                  {timeExpired ? (
                    "Time's up"
                  ) : (
                    <>
                      Time left: {Math.floor(timeLeft / 60)}:
                      {String(timeLeft % 60).padStart(2, "0")}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={20}
                    fill={
                      index < activeChallenge.difficulty
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      index < activeChallenge.difficulty
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <h2 className="font-bold text-indigo-950 mb-2">
                ML Semantic Evaluation
              </h2>
              <p className="text-sm text-indigo-900 leading-6">
                Your answer will be compared with the expected answer using
                sentence embeddings and semantic similarity. This means the
                system evaluates meaning, not only keywords.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="font-bold text-lg mb-2">Scenario</h2>
              <p className="text-slate-700 leading-7">
                {activeChallenge.prompt}
              </p>
            </div>
            {activeChallenge.options && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Options</h3>
                <ul className="space-y-2">
                  {activeChallenge.options.map((option, index) => (
                    <li
                      key={index}
                      className="p-3 border rounded-lg bg-slate-50"
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeChallenge.code && (
              <pre className="bg-slate-950 text-slate-100 text-sm rounded-xl p-5 overflow-x-auto mb-8">
                <code>{activeChallenge.code}</code>
              </pre>
            )}

            <div className="mb-8">
              <h2 className="font-bold text-lg mb-3">Task</h2>
              <ol className="space-y-3 list-decimal list-inside text-slate-700">
                {activeChallenge.tasks.map((task: string) => (
                  <li key={task}>{task}</li>
                ))}
              </ol>
            </div>

            <div className="mb-8">
              <h2 className="font-bold text-lg mb-3">Your Answer</h2>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitted || isEvaluating || timeExpired}
                placeholder="Write your solution here..."
                className="w-full min-h-[260px] border border-slate-300 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none disabled:bg-slate-50"
              />
            </div>

            {!submitted ? (
              <button
                onClick={() => submitAnswer(false)}
                disabled={answer.trim().length < 20 || isEvaluating || timeExpired}
                className="flex items-center justify-center gap-2 w-full bg-slate-950 text-white rounded-xl py-4 font-semibold hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {isEvaluating
                  ? "Evaluating with ML..."
                  : timeExpired
                  ? "Time's Up"
                  : "Submit Answer"}
              </button>
            ) : (
              evaluation && (
                <div className="space-y-6">
                  <div className="bg-slate-950 text-white rounded-2xl p-6">
                    <p className="text-sm text-slate-300 mb-1">
                      {evaluation.usedML
                        ? "ML Evaluation Result"
                        : "Fallback Rubric Evaluation"}
                    </p>

                    <h3 className="text-3xl font-black">
                      {evaluation.score}/100 - {evaluation.level}
                    </h3>

                    {evaluation.usedML && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-slate-400">Semantic Quality</p>
                          <p className="font-bold">
                            {evaluation.quality_similarity}
                          </p>
                        </div>

                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-slate-400">Question Relevance</p>
                          <p className="font-bold">
                            {evaluation.relevance_similarity}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-slate-200 mt-3">
                      {evaluation.feedback}
                    </p>

                    <p className="text-sm text-slate-400 mt-3">
                      Word count: {evaluation.wordCount}
                    </p>
                  </div>

                  {!evaluation.usedML && evaluation.results?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {evaluation.results.map((item: any) => (
                        <div
                          key={item.point}
                          className={`rounded-2xl border p-4 flex gap-3 ${
                            item.matched
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          {item.matched ? (
                            <CheckCircle className="text-green-700 shrink-0" />
                          ) : (
                            <XCircle className="text-red-700 shrink-0" />
                          )}
                          <div>
                            <p
                              className={`font-semibold ${
                                item.matched
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              {item.matched ? "Covered" : "Missing"}
                            </p>
                            <p className="text-sm text-slate-700">
                              {item.point}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!evaluation.usedML &&
                    evaluation.missingPoints?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <h3 className="font-bold text-amber-900 mb-2">
                          What to Improve
                        </h3>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                          {evaluation.missingPoints.map((item: any) => (
                            <li key={item.point}>{item.point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                    <h3 className="font-bold text-green-900 mb-2">
                      Sample Strong Answer
                    </h3>
                    <p className="text-sm text-green-900 leading-7">
                      {activeChallenge.sampleAnswer}
                    </p>
                  </div>

                  <button
                    onClick={retryChallenge}
                    className="flex items-center justify-center gap-2 w-full border border-slate-300 bg-white rounded-xl py-4 font-semibold hover:bg-slate-100"
                  >
                    <RotateCcw size={18} />
                    Retry Challenge
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950 px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Exams and Assessments Practice
            </h1>
            <p className="text-slate-600 mt-3 max-w-3xl text-lg">
              Prepare for real company exams, technical assessments, 
              and hiring challenges used by top employers.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 border border-slate-300 rounded-full px-5 py-2 bg-white text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <Briefcase className="mb-3 text-slate-800" />
            <h3 className="font-bold">Real company-style questions</h3>
            <p className="text-sm text-slate-600 mt-1">
                Practice questions inspired by exams and assessments from major companies.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <Clock className="mb-3 text-slate-800" />
            <h3 className="font-bold">Timed practice</h3>
            <p className="text-sm text-slate-600 mt-1">
              Challenges include suggested time limits like real assessments.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <Trophy className="mb-3 text-slate-800" />
            <h3 className="font-bold">ML-based feedback</h3>
            <p className="text-sm text-slate-600 mt-1">
              Answers are evaluated using semantic similarity, not only keyword
              rules.
            </p>
          </div>
        </section>

        <div className="flex gap-3 flex-wrap mb-8">
          {majors.map((major) => (
            <button
              key={major}
              onClick={() => setSelectedMajor(major)}
              className={`px-4 py-2 rounded-full border text-sm font-medium ${
                selectedMajor === major
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {major}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                onClick={() => setSelectedChallenge(challenge)}
                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition cursor-pointer ${
                  selectedChallenge.id === challenge.id
                    ? "border-slate-900"
                    : "border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={17}
                        fill={
                          index < challenge.difficulty ? "currentColor" : "none"
                        }
                        className={
                          index < challenge.difficulty
                            ? "text-amber-400"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>

                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                    {challenge.time}
                  </span>
                </div>

                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                  {challenge.major}
                </span>

                <h2 className="text-xl font-black mt-5 mb-3">
                  {challenge.title}
                </h2>

                <p className="text-slate-600 text-sm leading-6 mb-5">
                  {challenge.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                    {challenge.type}
                  </span>
                  {challenge.testedSkills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startChallenge(challenge);
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-slate-950 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800"
                >
                  <Play size={15} />
                  Start Challenge
                </button>
              </div>
            ))}
          </section>

          <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-fit sticky top-6">
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              {selectedChallenge.major}
            </span>

            <h2 className="text-2xl font-black mt-4">
              {selectedChallenge.title}
            </h2>

            <p className="text-slate-600 leading-6 my-6">
              {selectedChallenge.prompt}
            </p>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Your Task</h3>
              <ol className="space-y-2 list-decimal list-inside text-slate-700 text-sm">
                {selectedChallenge.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => startChallenge(selectedChallenge)}
              className="w-full bg-slate-950 text-white rounded-xl py-3 font-semibold hover:bg-slate-800"
            >
              Start This Challenge
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
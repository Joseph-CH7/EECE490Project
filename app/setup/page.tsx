"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, Briefcase, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function SetupPage() {
  const router = useRouter();

  const [cvFileName, setCvFileName] = useState("");
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("Mixed");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim() && !cvText.trim()) {
      alert("Please paste a CV summary or a job description first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cvText, jobDescription, interviewType }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to generate questions.");
        return;
      }

      localStorage.setItem("cvText", cvText);
      localStorage.setItem("jobDescription", jobDescription);
      localStorage.setItem("interviewType", interviewType);
      localStorage.setItem("questions", JSON.stringify(data.questions || []));
      localStorage.setItem("questionDetails", JSON.stringify(data.questionDetails || data.questions || []));
      localStorage.setItem("inferredCategory", data.inferredCategory || "");

      router.push("/interview");
    } catch {
      alert("Something went wrong while generating questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black tracking-tight">InterviewPro</p>
            <p className="text-sm text-slate-500">Interview setup</p>
          </div>

          <Link href="/">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back Home
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="space-y-3">
          <Badge className="rounded-full bg-emerald-100 px-4 py-1 text-emerald-700 hover:bg-emerald-100">
            Personalized Interview Setup
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Generate a personalized interview
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Upload a CV, add the target job description, and choose the interview type before starting.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Upload CV</label>

                <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
                  <Upload className="mb-3 h-8 w-8 text-slate-500" />
                  <span className="font-medium text-slate-700">Click to upload your CV as PDF</span>
                  <span className="mt-1 text-sm text-slate-500">
                    {cvFileName || "No file selected yet"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setCvFileName(e.target.files?.[0]?.name || "")}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">CV Text or Summary</label>
                <Textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV text, skills, or a short resume summary here so the model can infer your category..."
                  className="min-h-[180px] rounded-3xl border-slate-200 p-4 text-base"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Job Description</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description here..."
                  className="min-h-[260px] rounded-3xl border-slate-200 p-4 text-base"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Interview Preferences</CardTitle>
                <CardDescription>
                  Choose the type of interview you want to practice.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Interview Type</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["Technical", "Behavioral", "Mixed"].map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant={interviewType === item ? "default" : "outline"}
                        className={`rounded-2xl ${
                          interviewType === item ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""
                        }`}
                        onClick={() => setInterviewType(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                    <p className="font-semibold text-slate-900">Preview</p>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-800">CV:</span> {cvFileName || "Not uploaded"}</p>
                    <p><span className="font-medium text-slate-800">CV Text:</span> {cvText ? "Added" : "Not added yet"}</p>
                    <p><span className="font-medium text-slate-800">Interview Type:</span> {interviewType}</p>
                    <p><span className="font-medium text-slate-800">Job Description:</span> {jobDescription ? "Added" : "Not added yet"}</p>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  {loading ? "Generating..." : "Generate My Interview"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">What happens next?</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      The system will analyze your CV text and job description, infer a likely job category, and select tailored questions from your dataset.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

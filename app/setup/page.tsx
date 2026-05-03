"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, Briefcase, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const CATEGORY_OPTIONS = [
  { value: "software_engineering", label: "Software Engineering" },
  { value: "data_science", label: "Data Science" },
  { value: "human_resources", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "design_creative", label: "Design / Creative" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hospitality", label: "Hospitality" },
  { value: "business_development", label: "Business Development" },
  { value: "construction", label: "Construction" },
  { value: "fitness_wellness", label: "Fitness / Wellness" },
];

function normalizeCategoryInput(value: string) {
  const cleaned = value.trim().toLowerCase();
  const exact = CATEGORY_OPTIONS.find(
    (option) =>
      option.value === cleaned ||
      option.label.toLowerCase() === cleaned,
  );

  if (exact) {
    return exact.value;
  }

  return cleaned
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function SetupPage() {
  const router = useRouter();

  const [cvFileName, setCvFileName] = useState("");
  const [extractedCvText, setExtractedCvText] = useState("");
  const [detectedCategory, setDetectedCategory] = useState("");
  const [categoryOverride, setCategoryOverride] = useState("Software Engineering");
  const [extractedCharacterCount, setExtractedCharacterCount] = useState(0);
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("Mixed");
  const [loading, setLoading] = useState(false);
  const [cvExtracting, setCvExtracting] = useState(false);
  const [cvUploadError, setCvUploadError] = useState("");

  const handleCvUpload = async (file: File | undefined) => {
    setCvUploadError("");
    setDetectedCategory("");
    setExtractedCvText("");
    setExtractedCharacterCount(0);

    if (!file) {
      setCvFileName("");
      return;
    }

    setCvFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setCvExtracting(true);

      const res = await fetch("/api/extract-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setCvUploadError(data.error || "Failed to extract CV text.");
        return;
      }

      setExtractedCvText(data.text || "");
      const nextCategory = data.displayCategory || data.inferredCategory || "";
      setDetectedCategory(nextCategory);
      setCategoryOverride(nextCategory);
      setExtractedCharacterCount(data.characterCount || 0);
    } catch {
      setCvUploadError("Something went wrong while extracting the CV text.");
    } finally {
      setCvExtracting(false);
    }
  };

  const handleGenerate = async () => {
    const cvInput = cvText.trim() || extractedCvText.trim();

    const selectedCategory = normalizeCategoryInput(categoryOverride);

    if (!jobDescription.trim() && !cvInput && !selectedCategory) {
      alert("Please choose a category, paste a CV summary, or add a job description first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: cvInput,
          jobDescription,
          interviewType,
          categoryOverride: selectedCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to generate questions.");
        return;
      }

      localStorage.setItem("cvText", cvInput);
      localStorage.setItem("jobDescription", jobDescription);
      localStorage.setItem("interviewType", interviewType);
      localStorage.setItem("questions", JSON.stringify(data.questions || []));
      localStorage.setItem("questionDetails", JSON.stringify(data.questionDetails || data.questions || []));
      localStorage.setItem("inferredCategory", data.inferredCategory || "");
      localStorage.setItem("selectedCategory", data.selectedCategory || normalizeCategoryInput(categoryOverride));

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
                    {cvExtracting
                      ? "Extracting CV text..."
                      : cvFileName || "No file selected yet"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleCvUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>

                {cvUploadError ? (
                  <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-800">
                      CV extraction failed
                    </p>
                    <p className="mt-1 text-sm text-rose-700">{cvUploadError}</p>
                  </div>
                ) : null}

                {detectedCategory ? (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-800">
                      Detected category: {detectedCategory}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      CV text was extracted and will be used for question matching. You can still write your own short summary below.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <input
                    list="job-category-options"
                    value={categoryOverride}
                    onChange={(e) => setCategoryOverride(e.target.value)}
                    placeholder="Search or choose your category"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <datalist id="job-category-options">
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.label} />
                    ))}
                  </datalist>
                  <p className="text-xs leading-5 text-slate-500">
                    This category is always used for question selection. CV upload can suggest it, but you can override it.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">CV Text or Summary</label>
                <Textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Write a short CV summary, key skills, or project highlights here. If you uploaded a CV, this can stay short."
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
                    <p><span className="font-medium text-slate-800">Category:</span> {categoryOverride || detectedCategory || "Not selected yet"}</p>
                    <p><span className="font-medium text-slate-800">Extracted CV:</span> {extractedCharacterCount ? `${extractedCharacterCount} characters ready` : "Not extracted yet"}</p>
                    <p><span className="font-medium text-slate-800">Manual Summary:</span> {cvText ? "Added" : "Not added yet"}</p>
                    <p><span className="font-medium text-slate-800">Interview Type:</span> {interviewType}</p>
                    <p><span className="font-medium text-slate-800">Job Description:</span> {jobDescription ? "Added" : "Not added yet"}</p>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || cvExtracting}
                  className="h-12 w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  {cvExtracting
                    ? "Extracting CV..."
                    : loading
                    ? "Generating..."
                    : "Generate My Interview"}
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

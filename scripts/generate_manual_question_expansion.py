from __future__ import annotations

from pathlib import Path
import csv


OUT_FILE = Path("data/processed/questions_manual_expansion.csv")


def behavioral_questions(role: str, category: str, topics: list[str], difficulty_cycle: list[str]) -> list[dict[str, str]]:
    prompts = [
        "Describe a time when you had to {topic}. What did you do and what was the outcome?",
        "Tell me about a situation where you needed to {topic}. How did you approach it?",
        "Describe a time when you were expected to {topic} under pressure. What happened?",
        "Tell me about a time when you learned something important while trying to {topic}.",
        "Describe a situation where you had to {topic} with limited time or resources.",
    ]
    rows: list[dict[str, str]] = []
    for index, topic in enumerate(topics):
        for offset, template in enumerate(prompts):
            rows.append(
                {
                    "question_text": template.format(topic=topic),
                    "ideal_answer": "",
                    "job_role": role,
                    "question_type": "behavioral",
                    "difficulty": difficulty_cycle[(index + offset) % len(difficulty_cycle)],
                    "source": "manual_expansion_2026",
                    "job_category": category,
                }
            )
    return rows


def technical_questions(role: str, category: str, concepts: list[str], difficulty_cycle: list[str]) -> list[dict[str, str]]:
    templates = [
        "What is {concept} and why does it matter in practice?",
        "How would you apply {concept} in a realistic {role_lower} scenario?",
        "What are the main tradeoffs or risks associated with {concept}?",
        "How would you evaluate whether {concept} is working effectively?",
        "What steps would you take to improve or troubleshoot {concept}?",
    ]
    rows: list[dict[str, str]] = []
    role_lower = role.lower()
    for index, concept in enumerate(concepts):
        for offset, template in enumerate(templates):
            rows.append(
                {
                    "question_text": template.format(concept=concept, role_lower=role_lower),
                    "ideal_answer": "",
                    "job_role": role,
                    "question_type": "technical",
                    "difficulty": difficulty_cycle[(index + offset) % len(difficulty_cycle)],
                    "source": "manual_expansion_2026",
                    "job_category": category,
                }
            )
    return rows


def main() -> None:
    difficulty_cycle = ["easy", "medium", "hard", "medium", "easy"]

    spec = {
        "software_engineering_behavioral": {
            "role": "Software Engineer",
            "category": "software_engineering",
            "behavioral_topics": [
                "resolve a code review disagreement",
                "debug a production issue quickly",
                "explain a complex technical idea to a non-technical stakeholder",
                "balance speed of delivery with code quality",
                "take ownership of a problem outside your formal scope",
                "recover from a release that did not go as planned",
                "improve maintainability in an existing codebase",
                "prioritize tasks during an engineering crunch",
                "work through conflicting feedback from teammates",
                "introduce a better engineering process to the team",
                "handle ambiguity in a technical task",
                "support a teammate who was blocked on a difficult issue",
                "make a technical decision with incomplete information",
                "push back on an unrealistic engineering deadline",
                "collaborate across teams to solve a system problem",
            ],
            "technical_concepts": [],
        },
        "data_science_behavioral": {
            "role": "Data Scientist",
            "category": "data_science",
            "behavioral_topics": [
                "explain model results to a non-technical stakeholder",
                "work with incomplete or messy data",
                "challenge an assumption in an experiment or analysis",
                "balance statistical rigor with business deadlines",
                "respond when a model performed worse than expected",
                "defend your methodology in a review meeting",
                "collaborate with engineers to deploy a model",
                "decide with incomplete data",
                "choose between a simple model and a complex model",
                "spot a misleading metric before a decision was made",
                "correct a stakeholder misunderstanding about model performance",
                "recover from an experiment that failed to produce a clear result",
                "handle disagreement about the right success metric",
                "work with a product team to turn analysis into action",
                "communicate uncertainty in a recommendation",
            ],
            "technical_concepts": [],
        },
        "finance": {
            "role": "Finance Analyst",
            "category": "finance",
            "behavioral_topics": [
                "explain a financial recommendation to a skeptical stakeholder",
                "work under a tight reporting deadline",
                "identify and correct a costly financial error",
                "prioritize competing requests from leadership",
                "handle a disagreement about budget assumptions",
                "communicate financial risk to a non-finance stakeholder",
                "adjust a forecast after receiving new information",
                "defend a recommendation when the numbers were uncertain",
                "balance detail and speed in a reporting cycle",
                "work through conflicting stakeholder expectations",
            ],
            "technical_concepts": [
                "variance analysis",
                "budget forecasting",
                "cash flow modeling",
                "financial statement analysis",
                "break-even analysis",
                "capital budgeting",
                "scenario analysis",
                "working capital management",
                "profitability analysis",
                "financial controls",
            ],
        },
        "design_creative": {
            "role": "Designer",
            "category": "design_creative",
            "behavioral_topics": [
                "defend a creative decision during feedback",
                "revise a design after receiving difficult criticism",
                "align design quality with a tight deadline",
                "collaborate with developers to implement a design",
                "handle conflicting stakeholder preferences",
                "change direction after user feedback",
                "explain a design tradeoff to a product manager",
                "work through ambiguity in a design brief",
                "balance originality with consistency in a system",
                "recover after a design idea failed in testing",
            ],
            "technical_concepts": [
                "design systems",
                "visual hierarchy",
                "user journey mapping",
                "accessibility in interface design",
                "prototype validation",
                "usability testing",
                "information architecture",
                "responsive design",
                "interaction patterns",
                "design critique methods",
            ],
        },
        "education": {
            "role": "Educator",
            "category": "education",
            "behavioral_topics": [
                "support a struggling learner",
                "adapt a lesson when students were disengaged",
                "handle conflicting classroom priorities",
                "communicate difficult feedback to a student or parent",
                "adjust your teaching plan based on evidence",
                "motivate a disengaged learner",
                "adapt to sudden curriculum or schedule changes",
                "balance classroom discipline with student support",
                "work with colleagues to improve outcomes",
                "respond when an instructional plan failed",
            ],
            "technical_concepts": [
                "lesson planning",
                "formative assessment",
                "classroom management strategies",
                "differentiated instruction",
                "learning outcome measurement",
                "curriculum alignment",
                "assessment design",
                "student progress tracking",
                "instructional scaffolding",
                "remediation planning",
            ],
        },
        "healthcare": {
            "role": "Healthcare Professional",
            "category": "healthcare",
            "behavioral_topics": [
                "communicate clearly during a stressful patient situation",
                "handle competing priorities during a busy shift",
                "notice and escalate a potential patient risk",
                "work through a disagreement within a care team",
                "support a patient or family through uncertainty",
                "adapt quickly during a high-pressure shift",
                "balance competing patient needs safely",
                "communicate a concerning change clearly",
                "learn from a near-miss or mistake",
                "improve a workflow that affected patient care",
            ],
            "technical_concepts": [
                "patient triage",
                "clinical documentation accuracy",
                "infection prevention protocols",
                "medication safety checks",
                "care coordination workflows",
                "handoff communication",
                "vital sign interpretation",
                "escalation protocols",
                "patient safety metrics",
                "treatment plan adherence",
            ],
        },
        "hospitality": {
            "role": "Hospitality Professional",
            "category": "hospitality",
            "behavioral_topics": [
                "de-escalate a difficult guest situation",
                "maintain service quality during peak demand",
                "recover after a service failure",
                "train a new team member quickly",
                "balance guest satisfaction with business policy",
                "handle a sudden staffing shortage",
                "coordinate service during an unexpected rush",
                "communicate clearly with an upset guest",
                "solve a problem before the guest escalated it",
                "maintain standards during operational stress",
            ],
            "technical_concepts": [
                "guest service recovery",
                "reservation management",
                "front-desk workflow optimization",
                "service quality standards",
                "shift scheduling",
                "occupancy planning",
                "check-in efficiency",
                "housekeeping coordination",
                "complaint tracking",
                "service turnaround metrics",
            ],
        },
        "business_development": {
            "role": "Business Development Specialist",
            "category": "business_development",
            "behavioral_topics": [
                "build trust with a difficult prospect",
                "recover from losing an important opportunity",
                "prioritize leads with limited time",
                "handle objections during a sales conversation",
                "align internal teams around a partnership opportunity",
                "re-engage a stalled opportunity",
                "build credibility in a new market",
                "respond when a deal changed unexpectedly",
                "work through conflicting goals across teams",
                "learn from a lost deal",
            ],
            "technical_concepts": [
                "pipeline qualification",
                "deal forecasting",
                "market segmentation",
                "partnership evaluation",
                "sales funnel metrics",
                "account prioritization",
                "opportunity scoring",
                "territory planning",
                "competitive positioning",
                "revenue forecasting",
            ],
        },
        "construction": {
            "role": "Construction Professional",
            "category": "construction",
            "behavioral_topics": [
                "keep a project moving after an unexpected delay",
                "address a safety concern on site",
                "coordinate multiple crews under pressure",
                "resolve a conflict between schedule and quality",
                "communicate project issues to stakeholders",
                "adapt after a material delay",
                "deal with conflicting instructions on site",
                "keep work safe during unexpected changes",
                "balance cost pressure with workmanship quality",
                "recover from a planning mistake",
            ],
            "technical_concepts": [
                "construction scheduling",
                "site safety planning",
                "material cost control",
                "quality inspection processes",
                "project progress tracking",
                "resource allocation",
                "change order management",
                "site logistics planning",
                "risk assessment",
                "equipment utilization",
            ],
        },
        "fitness_wellness": {
            "role": "Fitness and Wellness Professional",
            "category": "fitness_wellness",
            "behavioral_topics": [
                "motivate a client who was losing consistency",
                "adapt a wellness plan after poor results",
                "handle sensitive feedback from a client",
                "balance safety with an ambitious client goal",
                "work with a client who had competing constraints",
                "adapt a program when progress stalled",
                "communicate limits without discouraging the client",
                "build consistency in a struggling client",
                "respond when a client lost motivation",
                "coordinate wellness advice with other constraints",
            ],
            "technical_concepts": [
                "program progression planning",
                "recovery and load management",
                "client assessment metrics",
                "injury-risk modification",
                "habit-building strategies",
                "mobility assessment",
                "goal tracking",
                "training volume management",
                "exercise regression and progression",
                "wellness adherence planning",
            ],
        },
    }

    rows: list[dict[str, str]] = []
    for item in spec.values():
        if item["behavioral_topics"]:
            rows.extend(
                behavioral_questions(
                    item["role"],
                    item["category"],
                    item["behavioral_topics"],
                    difficulty_cycle,
                )
            )
        if item["technical_concepts"]:
            rows.extend(
                technical_questions(
                    item["role"],
                    item["category"],
                    item["technical_concepts"],
                    difficulty_cycle,
                )
            )

    # Deduplicate by exact text while preserving first occurrence.
    seen: set[str] = set()
    deduped_rows: list[dict[str, str]] = []
    for row in rows:
        key = row["question_text"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        deduped_rows.append(row)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "question_text",
                "ideal_answer",
                "job_role",
                "question_type",
                "difficulty",
                "source",
                "job_category",
            ],
        )
        writer.writeheader()
        writer.writerows(deduped_rows)

    print(f"Saved manual expansion to {OUT_FILE}")
    print("Rows:", len(deduped_rows))


if __name__ == "__main__":
    main()

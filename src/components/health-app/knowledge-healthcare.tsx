"use client";

import { AlertTriangle, BookOpenCheck, Brain, HelpCircle, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { emergencyCopy, label, text, ui } from "@/lib/health-app/i18n";
import { lessons, redFlags } from "@/lib/health-app/content";
import type { Lesson, Locale, LocalizedText } from "@/lib/health-app/types";
import type { InsuranceHelperResponse, SymptomRoutingResponse } from "@/lib/health-data/types";
import type { HealthInputAnalysisMode, HealthInputAnalysisResponse } from "@/lib/health-input-analysis";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SafetyDisclaimer } from "./dashboard-cards";

export function LearnPage({ locale }: { locale: Locale }) {
  const categories = Array.from(new Set(lessons.map((lesson) => text(lesson.category, locale))));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.learn}
        description={{
          zh: "每天學一個健康概念，把知識連到真實紀錄和下一步行動。",
          en: "Learn one health concept each day and connect it to logs and action.",
        }}
        locale={locale}
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category} variant="secondary">
            {category}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} locale={locale} />
        ))}
      </div>
    </div>
  );
}

export function LessonPage({ locale, slug }: { locale: Locale; slug?: string }) {
  const lesson = lessons.find((item) => item.slug === slug) ?? lessons[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader title={lesson.title} description={lesson.explanation} locale={locale} />
      <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {text(lesson.category, locale)} · {text(lesson.difficulty, locale)}
          </Badge>
          <CardTitle>{text(lesson.title, locale)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LessonBlock title={{ zh: "簡單解釋", en: "Simple explanation" }} body={lesson.explanation} locale={locale} />
          <LessonBlock title={{ zh: "例子", en: "Example" }} body={lesson.example} locale={locale} />
          <LessonBlock title={{ zh: "行動步驟", en: "Action step" }} body={lesson.actionStep} locale={locale} />
          <LessonBlock title={{ zh: "小測驗", en: "Quiz" }} body={lesson.quizQuestion} locale={locale} />
        </CardContent>
        <CardFooter className="justify-between">
          <Badge variant="secondary">{text(lesson.relatedTracker, locale)}</Badge>
          <Button asChild variant="outline">
            <Link href="/learn">{locale === "zh-Hant" ? "返回學習庫" : "Back to library"}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function HealthcarePage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.healthcare}
        description={{
          zh: "協助你理解在香港下一步可能是自我照護教育、普通科、專科或急症。這不是診斷。",
          en: "Understand whether a reasonable Hong Kong next step may be self-care education, GP, specialist, or A&E. This is not a diagnosis.",
        }}
        locale={locale}
      />

      <HealthInputAnalyzerForm locale={locale} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SymptomRoutingForm locale={locale} />
        <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "緊急警號" : "Urgent signs"}</CardTitle>
            <CardDescription>{locale === "zh-Hant" ? "出現以下情況，不要等待 AI 或保險確認。" : "If these appear, do not wait for AI or insurance confirmation."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {redFlags.map((flag) => (
              <div key={flag.en} className="flex items-center gap-2 rounded-xl bg-muted/30 p-2 text-sm ring-1 ring-border/40">
                <AlertTriangle aria-hidden="true" className="text-destructive" />
                {text(flag, locale)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <CareLevelCard title={{ zh: "自我照護教育", en: "Self-care education" }} body={{ zh: "輕微、短暫、沒有警號的情況，可先學習觀察和何時求醫。", en: "Mild, short-lived concerns without red flags can start with observation and care education." }} locale={locale} />
        <CareLevelCard title={{ zh: "普通科 / 家庭醫生", en: "GP / family doctor" }} body={{ zh: "不確定原因、需要初步檢查或轉介時通常適合先看普通科。", en: "For unclear causes, initial checks, or referral, a GP is often a reasonable first step." }} locale={locale} />
        <CareLevelCard title={{ zh: "專科或急症", en: "Specialist or A&E" }} body={{ zh: "急性嚴重症狀先急症；非急但持續或複雜問題可由醫生轉介專科。", en: "Acute severe symptoms need A&E; persistent or complex non-urgent issues may need specialist referral." }} locale={locale} />
      </div>
    </div>
  );
}

export function HealthInputAnalyzerForm({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<HealthInputAnalysisMode>("auto");
  const [result, setResult] = useState<HealthInputAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      toast.error(locale === "zh-Hant" ? "請輸入需要分析的內容。" : "Please enter text to analyze.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/health/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          input: trimmed,
          mode,
          language: locale,
        }),
      });
      const body = (await response.json()) as HealthInputAnalysisResponse | { error: string };

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Analysis failed");
      }

      setResult(body as HealthInputAnalysisResponse);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : locale === "zh-Hant" ? "分析失敗，請稍後再試。" : "Analysis failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
      <form onSubmit={onSubmit}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{locale === "zh-Hant" ? "健康輸入分析" : "Health Input Analysis"}</CardTitle>
              <CardDescription>
                {locale === "zh-Hant"
                  ? "輸入症狀、保險、索償、營養或健身問題；系統會先檢查安全邊界。"
                  : "Enter symptoms, insurance, claims, nutrition, or fitness questions; safety boundaries are checked first."}
              </CardDescription>
            </div>
            <Badge variant="secondary">{locale === "zh-Hant" ? "匿名可用" : "Anonymous ready"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <Select value={mode} onValueChange={(value) => setMode(value as HealthInputAnalysisMode)}>
              <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "分析模式" : "Analysis mode"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{locale === "zh-Hant" ? "分析模式" : "Analysis mode"}</SelectLabel>
                  <SelectItem value="auto">{locale === "zh-Hant" ? "自動判斷" : "Auto detect"}</SelectItem>
                  <SelectItem value="medical">{locale === "zh-Hant" ? "醫療導航" : "Medical navigation"}</SelectItem>
                  <SelectItem value="insurance">{locale === "zh-Hant" ? "保險需要" : "Insurance needs"}</SelectItem>
                  <SelectItem value="policy">{locale === "zh-Hant" ? "保單 / 索償" : "Policy / claims"}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={3000}
              placeholder={
                locale === "zh-Hant"
                  ? "例如：我胸口痛又氣促，或者：我想理解住院保單等候期。"
                  : "Example: I have chest pain and shortness of breath, or: I want to understand a hospital policy waiting period."
              }
              aria-label={locale === "zh-Hant" ? "需要分析的內容" : "Text to analyze"}
              className="min-h-24"
            />
          </div>

          <Button disabled={loading}>
            <Brain data-icon="inline-start" aria-hidden="true" />
            {loading ? (locale === "zh-Hant" ? "分析中" : "Analyzing") : (locale === "zh-Hant" ? "分析輸入" : "Analyze input")}
          </Button>

          {result ? <HealthInputAnalysisResult result={result} locale={locale} /> : (
            <Alert>
              <ShieldCheck data-icon="inline-start" aria-hidden="true" />
              <AlertTitle>{locale === "zh-Hant" ? "安全優先" : "Safety first"}</AlertTitle>
              <AlertDescription>{locale === "zh-Hant" ? emergencyCopy.zh : emergencyCopy.en}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </form>
    </Card>
  );
}

function HealthInputAnalysisResult({
  result,
  locale,
}: {
  result: HealthInputAnalysisResponse;
  locale: Locale;
}) {
  return (
    <div className="grid gap-3">
      <Alert variant={result.safety.safetyLocked ? "destructive" : "default"}>
        <Stethoscope data-icon="inline-start" aria-hidden="true" />
        <AlertTitle>{result.summary.urgencyLabel}</AlertTitle>
        <AlertDescription className="whitespace-pre-line leading-6">
          {result.assistant.message}
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{result.detectedDomain}</Badge>
        <Badge variant="outline">{result.intakeMode}</Badge>
        <Badge variant={result.safety.safetyLocked ? "destructive" : "secondary"}>
          {result.safety.level}
        </Badge>
        <Badge variant="outline">{result.assistant.ai.status}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <AnalysisBlock
          title={locale === "zh-Hant" ? "下一步" : "Next step"}
          body={result.summary.nextAction}
        />
        <AnalysisBlock
          title={locale === "zh-Hant" ? "照護方向" : "Care route"}
          body={result.summary.careRoute}
        />
      </div>

      {result.followUpQuestions.length > 0 ? (
        <div className="rounded-xl border border-border/50 bg-muted/25 p-3">
          <p className="mb-2 text-sm font-medium">{locale === "zh-Hant" ? "可補充資料" : "Helpful details"}</p>
          <ul className="grid gap-1 text-sm leading-6 text-muted-foreground">
            {result.followUpQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-background/55 p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

export function InsurancePage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.insurance}
        description={{
          zh: "解釋保單概念、整理索償文件和應問保險公司的問題。不推薦具體產品，不保證索償結果。",
          en: "Explain policy concepts, organize claim documents, and list insurer questions. No specific product recommendations or claim guarantees.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <InsuranceHelperForm locale={locale} />
        <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "可解釋的保障類型" : "Coverage types explained"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { zh: "住院保險", en: "Hospital insurance" },
              { zh: "門診保障", en: "Outpatient coverage" },
              { zh: "危疾保險", en: "Critical illness" },
              { zh: "意外保險", en: "Accident insurance" },
              { zh: "牙科保險", en: "Dental insurance" },
              { zh: "旅遊保險", en: "Travel insurance" },
            ].map((item) => (
              <div key={item.en} className="rounded-xl bg-muted/30 p-3 text-sm ring-1 ring-border/40">
                {text(item, locale)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

export function SymptomRoutingForm({ locale }: { locale: Locale }) {
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [preference, setPreference] = useState("either");
  const [redFlag, setRedFlag] = useState("none");
  const [result, setResult] = useState<SymptomRoutingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = `${symptoms}. ${redFlag === "none" ? "" : redFlag}`.trim();

    if (!input) {
      toast.error(locale === "zh-Hant" ? "請輸入症狀。" : "Please enter symptoms.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/symptom-routing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          input,
          duration,
          severity,
          carePreference: preference === "not-sure" ? "not_sure" : preference,
          language: locale,
        }),
      });
      const body = (await response.json()) as SymptomRoutingResponse | { error: string };

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Routing failed");
      }

      setResult(body as SymptomRoutingResponse);
    } catch {
      toast.error(locale === "zh-Hant" ? "儲存失敗，請檢查網絡後再試。" : "Save failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>{label(ui.symptomRouting, locale)}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant"
              ? "請描述症狀、時間、嚴重程度和是否有警號。"
              : "Describe symptoms, duration, severity, and any red flags."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          {locale === "zh-Hant" ? "症狀" : "Symptoms"}
          <Textarea value={symptoms} onChange={(event) => setSymptoms(event.target.value)} placeholder={locale === "zh-Hant" ? "例如：跑步後膝部痛兩日，沒有腫脹。" : "Example: knee pain for two days after running, no swelling."} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder={locale === "zh-Hant" ? "持續時間，例如兩日" : "Duration, e.g. two days"} aria-label={locale === "zh-Hant" ? "持續時間" : "Duration"} />
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "嚴重程度" : "Severity"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{locale === "zh-Hant" ? "嚴重程度" : "Severity"}</SelectLabel>
                <SelectItem value="mild">{locale === "zh-Hant" ? "輕微" : "Mild"}</SelectItem>
                <SelectItem value="moderate">{locale === "zh-Hant" ? "中等" : "Moderate"}</SelectItem>
                <SelectItem value="severe">{locale === "zh-Hant" ? "嚴重" : "Severe"}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={redFlag} onValueChange={setRedFlag}>
            <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "緊急警號" : "Red flags"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">{locale === "zh-Hant" ? "沒有以上警號" : "No listed red flags"}</SelectItem>
                {redFlags.map((flag) => (
                  <SelectItem key={flag.en} value={flag.en}>
                    {text(flag, locale)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={preference} onValueChange={setPreference}>
            <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "照護偏好" : "Care preference"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="public">{locale === "zh-Hant" ? "公營醫療" : "Public healthcare"}</SelectItem>
                <SelectItem value="private">{locale === "zh-Hant" ? "私營醫療" : "Private healthcare"}</SelectItem>
                <SelectItem value="either">{locale === "zh-Hant" ? "都可以" : "Either"}</SelectItem>
                <SelectItem value="not-sure">{locale === "zh-Hant" ? "未確定" : "Not sure"}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

          <Button disabled={loading}>
            <Stethoscope data-icon="inline-start" aria-hidden="true" />
            {loading ? (locale === "zh-Hant" ? "檢查中" : "Checking") : (locale === "zh-Hant" ? "檢查照護方向" : "Check care direction")}
          </Button>

          {result ? (
          <Alert variant={result.redFlagDetected ? "destructive" : "default"}>
            <Stethoscope data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>{result.redFlagDetected ? (locale === "zh-Hant" ? "請立即求急症服務" : "Seek emergency care now") : result.careLevel}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 leading-6">
              <span>{result.summary}</span>
              <span>
                {locale === "zh-Hant" ? "根據你分享的資料，合理下一步可能是：" : "Based on what you shared, a reasonable next step may be:"} {result.nextStep}
              </span>
              <span>{result.notDiagnosis}</span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <HelpCircle data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>{locale === "zh-Hant" ? "這不是診斷" : "This is not a diagnosis"}</AlertTitle>
            <AlertDescription>{locale === "zh-Hant" ? emergencyCopy.zh : emergencyCopy.en}</AlertDescription>
          </Alert>
        )}
        </CardContent>
      </form>
    </Card>
  );
}

export function InsuranceHelperForm({ locale }: { locale: Locale }) {
  const [question, setQuestion] = useState("");
  const [type, setType] = useState("hospital");
  const [policyText, setPolicyText] = useState("");
  const [claimContext, setClaimContext] = useState("");
  const [result, setResult] = useState<InsuranceHelperResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const hasQuestion = question.trim().length > 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasQuestion && !policyText.trim()) {
      toast.error(locale === "zh-Hant" ? "請輸入保險問題或保單文字。" : "Please enter an insurance question or policy text.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/insurance-helper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          topic: question || "保單理解",
          text: [question, policyText, claimContext].filter(Boolean).join("\n\n"),
          insurance_type: type,
          language: locale,
        }),
      });
      const body = (await response.json()) as InsuranceHelperResponse | { error: string };

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Insurance helper failed");
      }

      setResult(body as InsuranceHelperResponse);
    } catch {
      toast.error(locale === "zh-Hant" ? "AI 暫時未能回應，你仍可查看已儲存的紀錄和建議。" : "AI is temporarily unavailable. You can still view saved logs and recommendations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>{label(ui.insurancePolicyHelper, locale)}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant"
              ? "貼上問題或保單文字，系統會整理重點和需要問保險公司的問題。"
              : "Paste a question or policy text, and the system organizes key points and insurer questions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "保險類型" : "Insurance type"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="hospital">{locale === "zh-Hant" ? "住院" : "Hospital"}</SelectItem>
              <SelectItem value="outpatient">{locale === "zh-Hant" ? "門診" : "Outpatient"}</SelectItem>
              <SelectItem value="critical_illness">{locale === "zh-Hant" ? "危疾" : "Critical illness"}</SelectItem>
              <SelectItem value="accident">{locale === "zh-Hant" ? "意外" : "Accident"}</SelectItem>
              <SelectItem value="dental">{locale === "zh-Hant" ? "牙科" : "Dental"}</SelectItem>
              <SelectItem value="travel">{locale === "zh-Hant" ? "旅遊" : "Travel"}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={locale === "zh-Hant" ? "例如：我想理解住院保單的不保事項、等候期和索償流程。" : "Example: I want to understand exclusions, waiting periods, and claim steps."} />
        <Textarea value={policyText} onChange={(event) => setPolicyText(event.target.value)} placeholder={locale === "zh-Hant" ? "保單文字（可選）" : "Policy text optional"} />
        <Textarea value={claimContext} onChange={(event) => setClaimContext(event.target.value)} placeholder={locale === "zh-Hant" ? "索償情況（可選）" : "Claim situation optional"} />
        <Button disabled={loading}>
          <ShieldCheck data-icon="inline-start" aria-hidden="true" />
          {loading ? (locale === "zh-Hant" ? "整理中" : "Preparing") : (locale === "zh-Hant" ? "整理保險問題" : "Prepare insurance questions")}
        </Button>

        <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/40">
          <h3 className="font-medium">{locale === "zh-Hant" ? "回應預覽" : "Response preview"}</h3>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>{result?.summary ?? (hasQuestion ? "重點：先確認保障範圍、等候期、不保事項、網絡限制和自付額。" : "輸入問題後，這裡會整理重點。")}</p>
            <p>{result?.possibleMeaning ?? "應問保險公司：是否需要預先批核？哪些文件必須正本？是否有指定醫生或醫院網絡？"}</p>
            <p>{result ? `應問問題：${result.questionsToAskInsurer.join("；")}` : "準備文件：收據、醫療報告、轉介信、出院紙、化驗或影像報告。"}</p>
            <p>{result?.disclaimer ?? "聲明：這不是法律意見、保險銷售或索償保證。"}</p>
          </div>
        </div>
        </CardContent>
      </form>
    </Card>
  );
}

function LessonCard({ lesson, locale }: { lesson: Lesson; locale: Locale }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {text(lesson.category, locale)}
        </Badge>
        <CardTitle>{text(lesson.title, locale)}</CardTitle>
        <CardDescription>{text(lesson.explanation, locale)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-xl bg-muted/30 p-3 text-sm ring-1 ring-border/40 leading-6 text-muted-foreground">
          {text(lesson.actionStep, locale)}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline">
          <Link href={`/learn/${lesson.slug}`}>
            <BookOpenCheck data-icon="inline-start" aria-hidden="true" />
            {label(ui.readMore, locale)}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function LessonBlock({ title, body, locale }: { title: LocalizedText; body: LocalizedText; locale: Locale }) {
  return (
    <section className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/40">
      <h3 className="font-medium">{text(title, locale)}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text(body, locale)}</p>
    </section>
  );
}

function CareLevelCard({ title, body, locale }: { title: LocalizedText; body: LocalizedText; locale: Locale }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <ShieldCheck aria-hidden="true" />
        </span>
        <CardTitle>{text(title, locale)}</CardTitle>
        <CardDescription>{text(body, locale)}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function PageHeader({ title, description, locale }: { title: LocalizedText; description: LocalizedText; locale: Locale }) {
  return (
    <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl">
      <p className="text-sm text-muted-foreground">{text(ui.appNameFull, locale)}</p>
      <h2 className="mt-2 text-gradient-health text-3xl font-bold tracking-tight">{text(title, locale)}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text(description, locale)}</p>
    </section>
  );
}

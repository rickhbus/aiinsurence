"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  FileText,
  HeartPulse,
  LockKeyhole,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { EmotionAnalysisResult } from "@/lib/emotion-engine/types";
import type {
  GblAnalysisResult,
  GblAnalysisType,
  GblUserType,
} from "@/lib/gbl/types";
import { text, ui } from "@/lib/health-app/i18n";
import type { Locale, LocalizedText } from "@/lib/health-app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { SafetyDisclaimer } from "./dashboard-cards";

type ApiError = {
  error: string;
  requestId?: string;
};

type GblModeOption = {
  type: GblAnalysisType;
  icon: LucideIcon;
  title: LocalizedText;
  description: LocalizedText;
  example: {
    title: LocalizedText;
    primaryConcern: LocalizedText;
    healthcareContext: LocalizedText;
    insuranceContext: LocalizedText;
    emotionText: LocalizedText;
  };
};

const gblModeOptions: GblModeOption[] = [
  {
    type: "insurance_analysis",
    icon: ShieldCheck,
    title: { zh: "保險 / 索償整理", en: "Insurance / claims" },
    description: {
      zh: "整理文件、問題和不確定位置，不作核保或索償決定。",
      en: "Organize documents, questions, and uncertainty without underwriting or claim decisions.",
    },
    example: {
      title: { zh: "住院索償文件", en: "Hospital claim documents" },
      primaryConcern: {
        zh: "住院後保險公司要求補交文件，我想整理下一步和要問的問題。",
        en: "The insurer asked for more documents after a hospital stay. I want to organize next steps and questions.",
      },
      healthcareContext: {
        zh: "已出院，準備覆診；需要整理醫生報告和收據。",
        en: "Discharged and preparing follow-up; needs doctor report and receipts organized.",
      },
      insuranceContext: {
        zh: "保險公司要求住院收據、出院摘要、轉介信和索償表格。",
        en: "Insurer asked for hospital receipts, discharge summary, referral letter, and claim form.",
      },
      emotionText: {
        zh: "我有點擔心文件太多會漏交。",
        en: "I am worried I may miss a document.",
      },
    },
  },
  {
    type: "healthcare_navigation",
    icon: Route,
    title: { zh: "醫療導航", en: "Care navigation" },
    description: {
      zh: "先守住緊急警號，再整理求醫路線、科別和覆診準備。",
      en: "Check emergency signs first, then organize care route, department, and visit prep.",
    },
    example: {
      title: { zh: "爸爸皮膚痕", en: "Dad has itchy skin" },
      primaryConcern: {
        zh: "爸爸皮膚痕咗兩個星期，想知道應該先睇邊一類醫生。",
        en: "My dad has had itchy skin for two weeks. I want to know which type of doctor to start with.",
      },
      healthcareContext: {
        zh: "沒有胸痛、呼吸困難或快速惡化；想先整理時間線和相片。",
        en: "No chest pain, breathing difficulty, or rapid worsening; wants to organize timeline and photos.",
      },
      insuranceContext: { zh: "", en: "" },
      emotionText: {
        zh: "家人有少少擔心，但暫時不是急症。",
        en: "Family is a little worried, but it does not seem urgent from the text.",
      },
    },
  },
  {
    type: "emotion_context",
    icon: HeartPulse,
    title: { zh: "情緒語氣支援", en: "Emotion tone support" },
    description: {
      zh: "只調整語氣和問題數量，不作臨床或保險決策。",
      en: "Adjust tone and question count only, not clinical or insurance decisions.",
    },
    example: {
      title: { zh: "照顧者壓力", en: "Caregiver stress" },
      primaryConcern: {
        zh: "我想把家人最近的照顧壓力整理成溫和、容易跟進的下一步。",
        en: "I want to turn recent caregiver stress into a gentle, easy-to-follow next step.",
      },
      healthcareContext: { zh: "家人需要較短的問題和清楚指示。", en: "Family needs shorter questions and clear instructions." },
      insuranceContext: { zh: "", en: "" },
      emotionText: {
        zh: "我有點攰，又怕講漏重點。",
        en: "I feel tired and worry I may miss the key points.",
      },
    },
  },
  {
    type: "general_case",
    icon: ClipboardCheck,
    title: { zh: "家庭 / 合作個案", en: "Family / partner case" },
    description: {
      zh: "把家庭照護、診所準備或合作需求整理成安全交接。",
      en: "Turn family care, clinic prep, or partnership needs into a safe handoff.",
    },
    example: {
      title: { zh: "家庭照護工作流", en: "Family care workflow" },
      primaryConcern: {
        zh: "我想整理一個家庭健康記錄、覆診準備和保險文件教育的安全流程。",
        en: "I want to organize a safe flow for family health logs, doctor prep, and insurance document education.",
      },
      healthcareContext: {
        zh: "每日只做簡短 check-in；緊急情況永遠先顯示 999 / 急症室。",
        en: "Daily check-in stays short; emergencies always show 999 / A&E first.",
      },
      insuranceContext: {
        zh: "只做保險教育和文件清單，不判斷承保、保障或索償結果。",
        en: "Insurance education and document checklist only; no underwriting, coverage, or claim outcome decisions.",
      },
      emotionText: {
        zh: "回覆要簡短、穩定，適合照顧者和長者。",
        en: "Responses should stay short and steady for caregivers and seniors.",
      },
    },
  },
];

const workflowSteps: Array<{ icon: LucideIcon; title: LocalizedText; body: LocalizedText }> = [
  {
    icon: LockKeyhole,
    title: { zh: "安全閘", en: "Safety gate" },
    body: {
      zh: "緊急、自傷、診斷、治療或保證語句先被規則引擎鎖定。",
      en: "Emergency, crisis, diagnosis, treatment, or guarantee language is locked by rules first.",
    },
  },
  {
    icon: Brain,
    title: { zh: "AI.GBL 正規化", en: "AI.GBL normalization" },
    body: {
      zh: "把醫療、保險、情緒和歷史摘要變成可審核個案。",
      en: "Turns healthcare, insurance, emotion, and history into an auditable case.",
    },
  },
  {
    icon: UserCheck,
    title: { zh: "人工交接", en: "Human handoff" },
    body: {
      zh: "輸出下一步、文件、問題和需要專業覆核的位置。",
      en: "Outputs next step, documents, questions, and professional-review points.",
    },
  },
];

export function GblPage({ locale }: { locale: Locale }) {
  const [title, setTitle] = useState(locale === "zh-Hant" ? "新個案" : "New case");
  const [analysisType, setAnalysisType] = useState<GblAnalysisType>("insurance_analysis");
  const [userType, setUserType] = useState<GblUserType>("patient_member");
  const [primaryConcern, setPrimaryConcern] = useState("");
  const [healthcareContext, setHealthcareContext] = useState("");
  const [insuranceContext, setInsuranceContext] = useState("");
  const [emotionText, setEmotionText] = useState("");
  const [save, setSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GblAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedMode = gblModeOptions.find((option) => option.type === analysisType) ?? gblModeOptions[0];

  function applyExample(option = selectedMode) {
    setAnalysisType(option.type);
    setTitle(text(option.example.title, locale));
    setPrimaryConcern(text(option.example.primaryConcern, locale));
    setHealthcareContext(text(option.example.healthcareContext, locale));
    setInsuranceContext(text(option.example.insuranceContext, locale));
    setEmotionText(text(option.example.emotionText, locale));
    setResult(null);
    setError(null);
  }

  async function submitAnalysis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/gbl/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          analysisType,
          userType,
          language: locale,
          primaryConcern,
          healthcareContext,
          insuranceContext,
          emotionText,
          save,
        }),
      });
      const body = (await response.json()) as GblAnalysisResult | ApiError;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "AI.GBL failed.");
      }

      setResult(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI.GBL failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <div className="grid gap-6 p-5 md:p-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,430px)]">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                <Brain aria-hidden="true" className="size-4" />
                {locale === "zh-Hant" ? "AI.GBL 全域智能層" : "AI.GBL Global Intelligence Layer"}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
                {locale === "zh-Hant" ? "AI 個案指揮中心" : "AI case command center"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {locale === "zh-Hant"
                  ? "先由規則引擎鎖定安全邊界，再讓 AI.GBL 整理醫療、保險、情緒和交接背景。輸出是下一步和問題清單，不是診斷、核保或索償決定。"
                  : "Rules lock safety boundaries first, then AI.GBL organizes healthcare, insurance, emotion, and handoff context. The output is next steps and questions, not diagnosis, underwriting, or claim decisions."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: { zh: "安全優先", en: "Safety first" }, value: "999 / A&E" },
                { label: { zh: "資料最少化", en: "Minimal data" }, value: locale === "zh-Hant" ? "不收 HKID" : "No HKID" },
                { label: { zh: "交接用途", en: "Handoff use" }, value: locale === "zh-Hant" ? "文件 + 問題" : "Docs + questions" },
              ].map((item) => (
                <div key={text(item.label, locale)} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{text(item.label, locale)}</p>
                  <p className="mt-1 text-lg font-bold tracking-normal">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => applyExample(gblModeOptions[0])}>
                <Sparkles aria-hidden="true" />
                {locale === "zh-Hant" ? "用索償範例" : "Use claim example"}
              </Button>
              <Button type="button" variant="outline" onClick={() => applyExample(gblModeOptions[1])}>
                <Route aria-hidden="true" />
                {locale === "zh-Hant" ? "用醫療導航範例" : "Use care example"}
              </Button>
            </div>
          </div>

          <WorkflowPreview locale={locale} />
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,450px)]">
        <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "建立安全 AI 個案" : "Create safe AI case"}</CardTitle>
            <CardDescription>
              {locale === "zh-Hant"
                ? "請只輸入需要分析的背景；不要輸入 HKID、完整保單號碼或付款資料。"
                : "Enter only the context needed for analysis; avoid HKID, full policy numbers, or payment data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submitAnalysis}>
              <div className="grid gap-3 md:grid-cols-2">
                {gblModeOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = option.type === analysisType;

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setAnalysisType(option.type)}
                      className={`rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 ${
                        selected ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 bg-background/50"
                      }`}
                    >
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Icon aria-hidden="true" className="size-4 text-primary" />
                        {text(option.title, locale)}
                      </span>
                      <span className="block text-xs leading-5 text-muted-foreground">
                        {text(option.description, locale)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "個案標題" : "Case title"}
                <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  {locale === "zh-Hant" ? "使用者類型" : "User type"}
                  <select
                    value={userType}
                    onChange={(event) => setUserType(event.target.value as GblUserType)}
                    className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="patient_member">{locale === "zh-Hant" ? "病人 / 會員" : "Patient / member"}</option>
                    <option value="provider_admin">{locale === "zh-Hant" ? "醫療提供者 / 管理員" : "Provider / admin"}</option>
                    <option value="broker_advisor">{locale === "zh-Hant" ? "保險顧問" : "Broker / adviser"}</option>
                    <option value="employer_hr">{locale === "zh-Hant" ? "僱主 / HR" : "Employer / HR"}</option>
                    <option value="unknown">{locale === "zh-Hant" ? "未確定" : "Unknown"}</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm leading-6 text-muted-foreground">
                  <strong className="block text-foreground">{text(selectedMode.title, locale)}</strong>
                  {text(selectedMode.description, locale)}
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "主要問題" : "Primary concern"}
                <Textarea
                  value={primaryConcern}
                  onChange={(event) => setPrimaryConcern(event.target.value)}
                  required
                  maxLength={3000}
                  placeholder={text(selectedMode.example.primaryConcern, locale)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "醫療背景（可選）" : "Healthcare context optional"}
                <Textarea
                  value={healthcareContext}
                  onChange={(event) => setHealthcareContext(event.target.value)}
                  maxLength={2000}
                  placeholder={text(selectedMode.example.healthcareContext, locale)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "保險 / 保單背景（可選）" : "Insurance / policy context optional"}
                <Textarea
                  value={insuranceContext}
                  onChange={(event) => setInsuranceContext(event.target.value)}
                  maxLength={3000}
                  placeholder={text(selectedMode.example.insuranceContext, locale)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "情緒背景（可選）" : "Emotion context optional"}
                <Textarea
                  value={emotionText}
                  onChange={(event) => setEmotionText(event.target.value)}
                  maxLength={3000}
                  placeholder={text(selectedMode.example.emotionText, locale)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={save} onChange={(event) => setSave(event.target.checked)} />
                {locale === "zh-Hant" ? "如已登入，保存結構化分析結果" : "Save structured result when signed in"}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="min-h-11 flex-1" disabled={loading || !primaryConcern.trim()}>
                  {loading ? (locale === "zh-Hant" ? "分析中" : "Analyzing") : (locale === "zh-Hant" ? "執行 AI.GBL 分析" : "Run AI.GBL analysis")}
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" className="min-h-11" onClick={() => applyExample()}>
                  {locale === "zh-Hant" ? "填入範例" : "Fill example"}
                </Button>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          </CardContent>
        </Card>

        <ResultPanel result={result} locale={locale} />
      </div>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

export function EmotionEnginePage({ locale }: { locale: Locale }) {
  const [textValue, setTextValue] = useState("");
  const [save, setSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitEmotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/emotion/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: textValue, language: locale, save }),
      });
      const body = (await response.json()) as EmotionAnalysisResult | ApiError;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Emotion analysis failed.");
      }

      setResult(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Emotion analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <IntelligenceHeader
        icon={HeartPulse}
        title={{ zh: "Emotion Engine 情緒引擎", en: "Emotion Engine" }}
        description={{
          zh: "以溫和方式摘要文字中的情緒背景，只用作調整語氣和下一步清晰度，不作臨床評估或保險決策。",
          en: "Gently summarize emotional context from text for tone and clarity only, not clinical assessment or insurance decisioning.",
        }}
        locale={locale}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "分析情緒背景" : "Analyze emotional context"}</CardTitle>
            <CardDescription>
              {locale === "zh-Hant"
                ? "這一步可略過。結果只描述「你的訊息聽起來...」，不會標籤你是某種人。"
                : "This step is optional. Results say what your message sounds like; they do not label who you are."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submitEmotion}>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "訊息文字" : "Message text"}
                <Textarea
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  maxLength={3000}
                  required
                  placeholder={locale === "zh-Hant" ? "例如：我有點擔心保險不會賠，文件又很多。" : "Example: I am worried the claim may not be paid and there are many documents."}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={save} onChange={(event) => setSave(event.target.checked)} />
                {locale === "zh-Hant" ? "如已登入，保存結構化情緒結果" : "Save structured emotion result when signed in"}
              </label>
              <Button type="submit" disabled={loading || !textValue.trim()}>
                {loading ? (locale === "zh-Hant" ? "分析中" : "Analyzing") : (locale === "zh-Hant" ? "分析情緒訊號" : "Analyze emotion signal")}
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          </CardContent>
        </Card>

        <EmotionResultPanel result={result} locale={locale} />
      </div>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

export function HistoryPage({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const headers = await getSupabaseRequestHeaders({
          Accept: "application/json",
        });
        const response = await fetch("/api/history?limit=30", {
          headers,
        });
        const body = (await response.json()) as { items: HistoryItem[] } | ApiError;

        if (!response.ok || "error" in body) {
          throw new Error("error" in body ? body.error : "History failed.");
        }

        if (active) {
          setItems(body.items);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "History failed.");
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <IntelligenceHeader
        icon={FileClock}
        title={{ zh: "分析歷史", en: "Analysis History" }}
        description={{
          zh: "查看已保存的 AI.GBL、Emotion Engine 和保險分析摘要。列表只載入最近項目，避免整段歷史一次載入。",
          en: "Review saved AI.GBL, Emotion Engine, and insurance analysis summaries. The list loads recent items only to avoid pulling full history at once.",
        }}
        locale={locale}
      />

      <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "最近分析" : "Recent analyses"}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant" ? "如尚未登入或 Supabase 未設定，歷史會保持空白。" : "If you are not signed in or Supabase is not configured, history remains empty."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!items && !error ? (
            <p className="text-sm text-muted-foreground">{locale === "zh-Hant" ? "載入中..." : "Loading..."}</p>
          ) : null}
          {items?.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
              {locale === "zh-Hant" ? "暫時沒有已保存分析。" : "No saved analyses yet."}
            </div>
          ) : null}
          {items?.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="rounded-xl border bg-background/50 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{item.kind}</Badge>
                <Badge variant="outline">{item.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowPreview({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/62 p-4 shadow-inner">
      <div className="mb-4 flex items-center gap-2">
        <Activity aria-hidden="true" className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">
          {locale === "zh-Hant" ? "安全 AI 工作流" : "Safe AI workflow"}
        </h2>
      </div>
      <div className="grid gap-3">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={text(step.title, locale)} className="flex gap-3 rounded-2xl border border-border/50 bg-card/72 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {index + 1}. {text(step.title, locale)}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text(step.body, locale)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  locale,
}: {
  result: GblAnalysisResult | null;
  locale: Locale;
}) {
  if (!result) {
    return (
      <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "等待分析" : "Waiting for analysis"}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant"
              ? "結果會顯示安全狀態、允許用途、禁止用途、下一步和交接對象。"
              : "Results will show safety status, allowed use, blocked use, next steps, and handoff owner."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            { icon: CheckCircle2, text: { zh: "規則引擎先判斷危險訊號", en: "Rule engine checks danger signals first" } },
            { icon: FileText, text: { zh: "AI.GBL 整理文件和問題", en: "AI.GBL organizes documents and questions" } },
            { icon: XCircle, text: { zh: "不作診斷、核保或索償結果判斷", en: "No diagnosis, underwriting, or claim-outcome decision" } },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={text(item.text, locale)} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3 text-sm">
                <Icon aria-hidden="true" className="size-4 text-primary" />
                {text(item.text, locale)}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.status}</Badge>
          <Badge variant={result.persisted ? "default" : "secondary"}>
            {result.persisted
              ? locale === "zh-Hant" ? "已保存" : "saved"
              : locale === "zh-Hant" ? "未保存" : "not saved"}
          </Badge>
          <Badge variant="outline">{result.workflowPlan.lane}</Badge>
        </div>
        <CardTitle>{locale === "zh-Hant" ? "AI.GBL 輸出" : "AI.GBL output"}</CardTitle>
        <CardDescription className="break-all">Request ID: {result.requestId}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm leading-6 text-muted-foreground">{result.userVisibleSummary}</p>
        </div>

        <ResultSection title={{ zh: "工作流定位", en: "Workflow plan" }} locale={locale}>
          <div className="grid gap-3">
            <MiniResult label={locale === "zh-Hant" ? "階段" : "Stage"} value={result.workflowPlan.stage} />
            <MiniResult label={locale === "zh-Hant" ? "主要用途" : "Primary use"} value={result.workflowPlan.primaryUse} />
            <MiniResult label={locale === "zh-Hant" ? "交接對象" : "Handoff"} value={result.workflowPlan.handoff} />
          </div>
          <div className="rounded-xl bg-muted/30 p-3 text-sm leading-6 ring-1 ring-border/40">
            <strong>{locale === "zh-Hant" ? "商業價值" : "Business value"}</strong>
            <p className="mt-1 text-muted-foreground">{result.workflowPlan.businessValue}</p>
          </div>
        </ResultSection>

        <ResultSection title={{ zh: "立即下一步", en: "Immediate actions" }} locale={locale}>
          {result.workflowPlan.immediateActions.map((action) => (
            <p key={action} className="rounded-xl bg-primary/5 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-primary/15">
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              {action}
            </p>
          ))}
        </ResultSection>

        <ResultSection title={{ zh: "禁止用途", en: "Blocked uses" }} locale={locale}>
          {result.workflowPlan.blockedUses.map((item) => (
            <p key={item} className="rounded-xl bg-destructive/5 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-destructive/15">
              <XCircle data-icon="inline-start" aria-hidden="true" />
              {item}
            </p>
          ))}
        </ResultSection>

        <ResultSection title={{ zh: "建議下一步", en: "Recommended next steps" }} locale={locale}>
          {result.recommendations.map((recommendation) => (
            <div key={recommendation.label} className="rounded-xl bg-muted/30 p-3 text-sm leading-6 ring-1 ring-border/40">
              <strong>{recommendation.label}</strong>
              <p className="mt-1 text-muted-foreground">{recommendation.nextStep}</p>
              <p className="mt-2 text-xs text-muted-foreground">{recommendation.rationale}</p>
            </div>
          ))}
        </ResultSection>
        <ResultSection title={{ zh: "安全標記", en: "Safety flags" }} locale={locale}>
          <FlagList flags={result.safetyFlags} />
        </ResultSection>
        <ResultSection title={{ zh: "聲明", en: "Disclaimers" }} locale={locale}>
          {result.disclaimers.map((item) => (
            <p key={item} className="text-sm leading-6 text-muted-foreground">
              <ShieldCheck data-icon="inline-start" aria-hidden="true" />
              {item}
            </p>
          ))}
        </ResultSection>
      </CardContent>
    </Card>
  );
}

function EmotionResultPanel({
  result,
  locale,
}: {
  result: EmotionAnalysisResult | null;
  locale: Locale;
}) {
  if (!result) {
    return (
      <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "情緒摘要" : "Emotion summary"}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant" ? "結果會保持溫和，避免臨床診斷或人格標籤。" : "Results stay gentle and avoid clinical diagnosis or personality labels."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.primary_emotion}</Badge>
          <Badge variant="secondary">{result.urgency_level}</Badge>
          <Badge variant={result.persisted ? "default" : "secondary"}>
            {result.persisted ? "saved" : "not saved"}
          </Badge>
        </div>
        <CardTitle>{locale === "zh-Hant" ? "Emotion Engine 輸出" : "Emotion Engine output"}</CardTitle>
        <CardDescription className="break-all">Request ID: {result.requestId}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{result.user_visible_summary}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <MiniResult label={locale === "zh-Hant" ? "信心" : "Confidence"} value={`${Math.round(result.confidence * 100)}%`} />
          <MiniResult label={locale === "zh-Hant" ? "建議語氣" : "Recommended tone"} value={result.recommended_tone} />
        </div>
        <div className="rounded-xl bg-muted/30 p-3 text-sm leading-6 ring-1 ring-border/40">
          <strong>{locale === "zh-Hant" ? "下一步" : "Next step"}</strong>
          <p className="mt-1 text-muted-foreground">{result.suggested_next_step}</p>
        </div>
        <FlagList flags={result.safety_flags} />
        <p className="text-xs leading-5 text-muted-foreground">{result.disclaimer}</p>
      </CardContent>
    </Card>
  );
}

function IntelligenceHeader({
  icon: Icon,
  title,
  description,
  locale,
}: {
  icon: LucideIcon;
  title: LocalizedText;
  description: LocalizedText;
  locale: Locale;
}) {
  return (
    <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Icon aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{text(ui.appNameFull, locale)}</p>
          <h2 className="text-gradient-health mt-2 text-3xl font-bold tracking-tight">{text(title, locale)}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text(description, locale)}</p>
        </div>
      </div>
    </section>
  );
}

function ResultSection({
  title,
  children,
  locale,
}: {
  title: LocalizedText;
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-medium">{text(title, locale)}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function FlagList({ flags }: { flags: Record<string, unknown> }) {
  const entries = Object.entries(flags);

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge key={key} variant={value ? "destructive" : "secondary"}>
          {key}: {String(value)}
        </Badge>
      ))}
    </div>
  );
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

type HistoryItem = {
  id: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  createdAt: string;
};

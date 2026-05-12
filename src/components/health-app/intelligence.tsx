"use client";

import { useEffect, useState } from "react";
import { Brain, FileClock, HeartPulse, ShieldCheck, type LucideIcon } from "lucide-react";
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
      <IntelligenceHeader
        icon={Brain}
        title={{ zh: "AI.GBL 全域智能層", en: "AI.GBL Global Intelligence Layer" }}
        description={{
          zh: "把醫療、保險、情緒和歷史摘要轉成可審核的個案背景。AI.GBL 只整理資訊和下一步，不作診斷、核保或索償決定。",
          en: "Normalize healthcare, insurance, emotion, and history into an auditable case context. AI.GBL organizes next steps only; it does not diagnose, underwrite, or decide claims.",
        }}
        locale={locale}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "建立 AI.GBL 個案" : "Create AI.GBL case"}</CardTitle>
            <CardDescription>
              {locale === "zh-Hant"
                ? "請只輸入需要分析的背景；不要輸入 HKID、完整保單號碼或付款資料。"
                : "Enter only the context needed for analysis; avoid HKID, full policy numbers, or payment data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submitAnalysis}>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "個案標題" : "Case title"}
                <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  {locale === "zh-Hant" ? "分析類型" : "Analysis type"}
                  <select
                    value={analysisType}
                    onChange={(event) => setAnalysisType(event.target.value as GblAnalysisType)}
                    className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="insurance_analysis">{locale === "zh-Hant" ? "保險分析" : "Insurance analysis"}</option>
                    <option value="healthcare_navigation">{locale === "zh-Hant" ? "醫療導航" : "Healthcare navigation"}</option>
                    <option value="emotion_context">{locale === "zh-Hant" ? "情緒背景" : "Emotion context"}</option>
                    <option value="general_case">{locale === "zh-Hant" ? "一般個案" : "General case"}</option>
                  </select>
                </label>
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
              </div>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "主要問題" : "Primary concern"}
                <Textarea
                  value={primaryConcern}
                  onChange={(event) => setPrimaryConcern(event.target.value)}
                  required
                  maxLength={3000}
                  placeholder={locale === "zh-Hant" ? "例如：我想整理住院索償被要求補文件的下一步。" : "Example: I want to organize next steps after being asked for more claim documents."}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "醫療背景（可選）" : "Healthcare context optional"}
                <Textarea value={healthcareContext} onChange={(event) => setHealthcareContext(event.target.value)} maxLength={2000} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "保險 / 保單背景（可選）" : "Insurance / policy context optional"}
                <Textarea value={insuranceContext} onChange={(event) => setInsuranceContext(event.target.value)} maxLength={3000} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {locale === "zh-Hant" ? "情緒背景（可選）" : "Emotion context optional"}
                <Textarea value={emotionText} onChange={(event) => setEmotionText(event.target.value)} maxLength={3000} />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={save} onChange={(event) => setSave(event.target.checked)} />
                {locale === "zh-Hant" ? "如已登入，保存結構化分析結果" : "Save structured result when signed in"}
              </label>
              <Button type="submit" disabled={loading || !primaryConcern.trim()}>
                {loading ? (locale === "zh-Hant" ? "分析中" : "Analyzing") : (locale === "zh-Hant" ? "執行 AI.GBL 分析" : "Run AI.GBL analysis")}
              </Button>
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
          <CardTitle>{locale === "zh-Hant" ? "分析結果" : "Analysis result"}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant" ? "結果會顯示摘要、建議、風險和聲明。" : "Results show summary, recommendations, risks, and disclaimers."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/78 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.status}</Badge>
          <Badge variant={result.persisted ? "default" : "secondary"}>
            {result.persisted ? "saved" : "not saved"}
          </Badge>
        </div>
        <CardTitle>{locale === "zh-Hant" ? "AI.GBL 輸出" : "AI.GBL output"}</CardTitle>
        <CardDescription className="break-all">Request ID: {result.requestId}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{result.userVisibleSummary}</p>
        <ResultSection title={{ zh: "建議下一步", en: "Recommended next steps" }} locale={locale}>
          {result.recommendations.map((recommendation) => (
            <div key={recommendation.label} className="rounded-xl bg-muted/30 p-3 text-sm leading-6 ring-1 ring-border/40">
              <strong>{recommendation.label}</strong>
              <p className="mt-1 text-muted-foreground">{recommendation.nextStep}</p>
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

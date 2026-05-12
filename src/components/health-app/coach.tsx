"use client";

import {
  Brain,
  DatabaseZap,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { suggestedPrompts } from "@/lib/health-app/content";
import { emergencyCopy, label, safetyCopy, text, ui } from "@/lib/health-app/i18n";
import type { CoachMessage, Locale } from "@/lib/health-app/types";
import type { CoachResponse } from "@/lib/health-data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MemoryConsentCard } from "./memory-consent-card";

export function RightCoachPanel({ locale, onClose }: { locale: Locale; onClose?: () => void }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[360px] shrink-0 overflow-y-auto border-l border-border/40 bg-background/72 p-3 backdrop-blur-2xl xl:flex xl:flex-col">
      <CoachSurface locale={locale} compact onClose={onClose} />
    </aside>
  );
}

export function CoachPage({ locale }: { locale: Locale }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <CoachSurface locale={locale} />
    </div>
  );
}

export function CoachSurface({
  locale,
  compact = false,
  onClose,
}: {
  locale: Locale;
  compact?: boolean;
  onClose?: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [pendingMemory, setPendingMemory] = useState<CoachResponse["memorySuggestion"]>(null);

  async function sendMessage(value = input) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: { zh: trimmed, en: trimmed } },
    ]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ message: trimmed, language: locale }),
      });
      const body = (await response.json()) as CoachResponse | { error: string };

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "AI failed");
      }
      const coachResponse = body as CoachResponse;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: {
            zh: `${coachResponse.answer}\n\n原因：${coachResponse.reason}\n\n下一步：${coachResponse.nextStep}\n\n安全提示：${coachResponse.safetyNote}`,
            en: `${coachResponse.answer}\n\nReason: ${coachResponse.reason}\n\nNext step: ${coachResponse.nextStep}\n\nSafety note: ${coachResponse.safetyNote}`,
          },
        },
      ]);
      setPendingMemory(coachResponse.memorySuggestion);
    } catch {
      toast.error(locale === "zh-Hant" ? "AI 暫時未能回應，你仍可查看已儲存的紀錄和建議。" : "AI is temporarily unavailable. You can still view saved logs and recommendations.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: {
            zh: "我會先檢查緊急警號，再用你的近期訓練、飲食和偏好，給一個安全、實際的下一步。這不是診斷。",
            en: "I’ll first check urgent warning signs, then use your recent training, food, and preferences to give one safe practical next step. This is not a diagnosis.",
          },
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const surface = (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", compact ? "h-full" : "min-h-[calc(100dvh-7rem)]")}>
      <CoachHeader locale={locale} compact={compact} onClose={onClose} />

      <StatusChips locale={locale} />

      <SectionFrame
        icon={ShieldAlert}
        title={label(ui.safety, locale)}
        tone="danger"
      >
        <p className="text-xs leading-5 text-muted-foreground">
          {locale === "zh-Hant" ? safetyCopy.zh : safetyCopy.en}
        </p>
      </SectionFrame>

      <SectionFrame
        icon={Sparkles}
        title={locale === "zh-Hant" ? "今日 AI 建議" : "Today AI Recommendation"}
      >
        <div className="grid gap-2 text-sm leading-6">
          <p className="font-medium">
            {locale === "zh-Hant" ? "等待你的真實紀錄" : "Waiting for your real records"}
          </p>
          <p className="text-muted-foreground">
            {locale === "zh-Hant"
              ? "教練只會根據你的輸入和已保存資料估算今日建議。新增紀錄或提出問題後才會生成內容。"
              : "The coach only estimates today’s plan from your input and saved data. Add records or ask a question to generate content."}
          </p>
          <p className="text-muted-foreground">
            {locale === "zh-Hant"
              ? "行動：先輸入一個目標、近期紀錄或照護問題。"
              : "Action: enter a goal, recent record, or care question first."}
          </p>
          <p className="text-muted-foreground">
            {locale === "zh-Hant"
              ? "安全：如有胸痛、嚴重氣促或痛楚惡化，請立即停止並求醫。"
              : "Safety: stop and seek care for chest pain, severe breathlessness, or worsening pain."}
          </p>
        </div>
      </SectionFrame>

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.slice(0, compact ? 7 : suggestedPrompts.length).map((prompt) => (
          <Button
            key={prompt.en}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-8 whitespace-normal rounded-2xl text-left transition-all duration-200 hover:shadow-sm"
            onClick={() => sendMessage(text(prompt, locale))}
          >
            {text(prompt, locale)}
          </Button>
        ))}
      </div>

      <ScrollArea className={cn("min-h-0 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm", compact ? "h-[24dvh]" : "h-[34dvh]")}>
        <div className="flex flex-col gap-3 p-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
              {locale === "zh-Hant"
                ? "未有對話。你可以先問一個健康、健身、營養、醫療導航或保險教育問題。"
                : "No conversation yet. Ask a health, fitness, nutrition, care navigation, or insurance education question."}
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] whitespace-pre-line rounded-2xl p-3 text-sm leading-6",
                message.role === "user"
                  ? "ml-auto bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-sm"
                  : "mr-auto bg-muted/50 text-muted-foreground",
              )}
            >
              {text(message.content, locale)}
            </div>
          ))}
        </div>
      </ScrollArea>

      {!compact ? (
        <div className="grid gap-3 md:grid-cols-2">
          <CoachInfoPanel
            icon={DatabaseZap}
            title={locale === "zh-Hant" ? "健康記憶摘要" : "Memory summary"}
            lines={[
              locale === "zh-Hant"
                ? "確認保存後的健康記憶會在這裡摘要。"
                : "Confirmed health memories will be summarized here.",
              locale === "zh-Hant"
                ? "未經你確認，不會把對話內容保存成記憶。"
                : "Conversation content is not saved as memory without your confirmation.",
            ]}
          />
          <CoachInfoPanel
            icon={Stethoscope}
            title={locale === "zh-Hant" ? "安全邊界" : "Safety boundary"}
            lines={[
              locale === "zh-Hant" ? "不診斷、不處方、不取代醫生。" : "No diagnosis, prescribing, or replacement for clinicians.",
              locale === "zh-Hant" ? "保險內容只作教育，不作銷售建議。" : "Insurance content is education, not sales advice.",
              locale === "zh-Hant" ? "記憶需要你確認才保存。" : "Memory is saved only after confirmation.",
            ]}
          />
        </div>
      ) : null}

      {!compact && pendingMemory?.shouldSuggest ? (
        <MemoryConsentCard
          locale={locale}
          category={pendingMemory.category}
          defaultText={{ zh: pendingMemory.content, en: pendingMemory.content }}
        />
      ) : !compact ? <MemoryConsentCard locale={locale} /> : null}

      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-muted-foreground">
        <ShieldAlert aria-hidden="true" className="mb-2 text-destructive" />
        {locale === "zh-Hant" ? emergencyCopy.zh : emergencyCopy.en}
      </div>

      <div className="mt-auto flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/60 p-3 backdrop-blur-sm">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            locale === "zh-Hant"
              ? "問我今日訓練、餐單、醫療導航或保險概念..."
              : "Ask about today’s workout, meals, care navigation, or insurance concepts..."
          }
          aria-label={text(ui.coach, locale)}
          className="min-h-16 rounded-xl border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex w-full gap-2">
          <Button type="button" className="flex-1 rounded-xl" disabled={sending} onClick={() => sendMessage()}>
            <Send data-icon="inline-start" aria-hidden="true" />
            {sending ? (locale === "zh-Hant" ? "回應中" : "Sending") : locale === "zh-Hant" ? "傳送" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return surface;
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-card/72 shadow-lg shadow-primary/5 backdrop-blur-xl">
      <CardContent className="pt-0">{surface}</CardContent>
    </Card>
  );
}

function CoachHeader({
  locale,
  compact,
  onClose,
}: {
  locale: Locale;
  compact: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <Brain aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-normal">{text(ui.coach, locale)}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {locale === "zh-Hant"
              ? "友善、實用、教育式，並會保留安全邊界。"
              : "Friendly, practical, educational, and safety-bounded."}
          </p>
        </div>
      </div>
      {compact && onClose ? (
        <Button variant="ghost" size="icon-sm" aria-label={locale === "zh-Hant" ? "關閉教練" : "Close coach"} onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

function StatusChips({ locale }: { locale: Locale }) {
  const items = [
    locale === "zh-Hant" ? "記憶: 需確認" : "Memory: confirm first",
    locale === "zh-Hant" ? "語言: 繁體中文" : "Language: Traditional Chinese",
    locale === "zh-Hant" ? "安全模式: 開啟" : "Safety mode: on",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SectionFrame({
  icon: Icon,
  title,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-background/50 p-3 backdrop-blur-sm", tone === "danger" && "border-destructive/20 bg-destructive/5")}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon aria-hidden="true" className={tone === "danger" ? "text-destructive" : "text-primary"} />
        {title}
      </div>
      {children}
    </section>
  );
}

function CoachInfoPanel({
  icon: Icon,
  title,
  lines,
}: {
  icon: LucideIcon;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Icon aria-hidden="true" />
        {title}
      </div>
      <ul className="flex flex-col gap-1 text-xs leading-5 text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

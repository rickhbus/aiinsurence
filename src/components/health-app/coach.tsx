"use client";

import {
  Brain,
  ClipboardCheck,
  DatabaseZap,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { coachMessages, memoryItems, suggestedPrompts } from "@/lib/health-app/mock-data";
import { emergencyCopy, label, safetyCopy, text, ui } from "@/lib/health-app/i18n";
import type { Locale } from "@/lib/health-app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MemoryConsentCard } from "./memory-consent-card";

export function RightCoachPanel({ locale }: { locale: Locale }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[360px] shrink-0 border-l bg-background/72 p-4 backdrop-blur-xl xl:flex xl:flex-col">
      <CoachSurface locale={locale} compact />
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

export function CoachSurface({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(coachMessages);

  function sendMessage(value = input) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: { zh: trimmed, en: trimmed } },
      {
        role: "assistant",
        content: {
          zh: "我會用安全方式處理：先檢查是否有緊急警號，再根據你的近期訓練、飲食和偏好給一個實際下一步。這不是診斷。",
          en: "I’ll handle this safely: first check urgent warning signs, then use your recent training, food, and preferences to suggest one practical next step. This is not a diagnosis.",
        },
      },
    ]);
    setInput("");
  }

  return (
    <Card className="flex min-h-[calc(100dvh-7rem)] flex-col bg-card/82 shadow-sm backdrop-blur-md xl:min-h-0 xl:flex-1">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Brain aria-hidden="true" />
            </span>
            <div>
              <CardTitle>{text(ui.coach, locale)}</CardTitle>
              <CardDescription>
                {locale === "zh-Hant"
                  ? "友善、實用、教育式，並會保留安全邊界。"
                  : "Friendly, practical, educational, and safety-bounded."}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Sparkles data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "今日建議" : "Today"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-lg border bg-muted/35 p-3 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">{label(ui.safety, locale)}: </strong>
          {locale === "zh-Hant" ? safetyCopy.zh : safetyCopy.en}
        </div>

        <ScrollArea className={compact ? "h-[30dvh] min-h-56" : "h-[42dvh] min-h-72"}>
          <div className="flex flex-col gap-3 pr-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-lg bg-primary p-3 text-sm leading-6 text-primary-foreground"
                    : "mr-8 rounded-lg bg-muted/55 p-3 text-sm leading-6 text-muted-foreground"
                }
              >
                {text(message.content, locale)}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.slice(0, compact ? 4 : suggestedPrompts.length).map((prompt) => (
            <Button
              key={prompt.en}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto min-h-8 whitespace-normal text-left"
              onClick={() => sendMessage(text(prompt, locale))}
            >
              {text(prompt, locale)}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <CoachInfoPanel
            icon={DatabaseZap}
            title={locale === "zh-Hant" ? "健康記憶摘要" : "Memory summary"}
            lines={memoryItems.slice(0, 3).map((item) => text(item.content, locale))}
          />
          <CoachInfoPanel
            icon={ClipboardCheck}
            title={locale === "zh-Hant" ? "快捷操作" : "Quick actions"}
            lines={[
              locale === "zh-Hant" ? "新增跑步 / 健身 / 飲食紀錄" : "Add run / gym / food log",
              locale === "zh-Hant" ? "檢查普通科、專科或急症方向" : "Check GP, specialist, or emergency route",
              locale === "zh-Hant" ? "整理保險索償文件" : "Organize claim documents",
            ]}
          />
        </div>

        {!compact ? <MemoryConsentCard locale={locale} /> : null}

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-muted-foreground">
          <ShieldAlert aria-hidden="true" className="mb-2 text-destructive" />
          {locale === "zh-Hant" ? emergencyCopy.zh : emergencyCopy.en}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            locale === "zh-Hant"
              ? "問我今日訓練、餐單、醫療導航或保險概念..."
              : "Ask about today’s workout, meals, care navigation, or insurance concepts..."
          }
          aria-label={text(ui.coach, locale)}
          className="min-h-20"
        />
        <div className="flex w-full gap-2">
          <Button type="button" className="flex-1" onClick={() => sendMessage()}>
            <Send data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "傳送" : "Send"}
          </Button>
          <Button type="button" variant="outline">
            <Stethoscope data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "導航" : "Route"}
          </Button>
        </div>
      </CardFooter>
    </Card>
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
    <div className="rounded-lg border bg-background/65 p-3">
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

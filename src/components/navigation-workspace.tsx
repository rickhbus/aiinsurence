"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowUp,
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  FileText,
  HeartPulse,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Stethoscope,
  UserRoundPlus,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/auth/auth-panel";
import { HumanDoctor3D } from "@/components/human-doctor-3d";
import { MemoryConsentCard } from "@/components/memory/memory-consent-card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { NavigationGuideResponse } from "@/lib/ai/types";
import { deriveDoctorAffect } from "@/lib/doctor-emotion-engine";
import {
  analyzeIntake,
  type IntakeMode,
  type Recommendation,
} from "@/lib/navigation-engine";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/user-memory";

type CarePreference = "public" | "private" | "either";
type LanguagePreference = "zh-Hant" | "en";

const modeCopy: Record<
  IntakeMode,
  {
    tab: string;
    label: string;
    description: string;
    placeholder: string;
    sample: string;
  }
> = {
  medical: {
    tab: "醫療導航",
    label: "症狀及科別導航 / Symptom routing",
    description: "先檢查危險徵兆，再建議急症、即日求醫、普通科或可能相關部門。",
    placeholder: "例如：我皮膚痕咗兩個星期，應該睇咩醫生？",
    sample: "我胸口痛，又覺得氣促，應該去邊度？",
  },
  insurance: {
    tab: "Insurance planning",
    label: "保險需要分析 / Insurance needs",
    description: "只建議保障類型及比較準則，不推薦具體保險產品。",
    placeholder: "例如：我 35 歲，自僱，住香港，應該買咩保險？",
    sample: "我 35 歲，自僱，住香港，沒有僱主醫療，應該買咩保險？",
  },
  policy: {
    tab: "Policy / claims",
    label: "保單及索償理解 / Policy explanation",
    description: "整理保單條款、索償流程和應向保險公司查問的問題。",
    placeholder: "例如：我想理解住院保單的不保事項、等候期和索償流程。",
    sample: "我想理解住院保單的不保事項、等候期和索償流程。",
  },
};

const modeValues: IntakeMode[] = ["medical", "insurance", "policy"];

export function NavigationWorkspace() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [supabase] = useState<SupabaseClient | null>(() =>
    getSupabaseBrowserClient(),
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<IntakeMode>("medical");
  const [language, setLanguage] = useState<LanguagePreference>("zh-Hant");
  const [carePreference, setCarePreference] =
    useState<CarePreference>("either");
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [memoryStatus, setMemoryStatus] = useState<string | null>(null);
  const [memoryDeclined, setMemoryDeclined] = useState(false);
  const [escalationStatus, setEscalationStatus] = useState<string | null>(null);

  const isEmergency = result?.urgency.level === 1;
  const isSameDayCare = result?.urgency.level === 2;
  const canOfferMemory =
    Boolean(result?.memoryProposal.canOffer) &&
    !isEmergency &&
    !memoryDeclined;
  const selectedModeCopy = modeCopy[mode];

  const doctorAffect = useMemo(
    () =>
      deriveDoctorAffect({
        input,
        isRecording,
        isSubmitting,
        mode,
        result,
        showGreeting: !input.trim() && !result && !isSubmitting,
      }),
    [input, isRecording, isSubmitting, mode, result],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isActive) {
        setUser(data.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleModeChange(nextMode: string) {
    if (!modeValues.includes(nextMode as IntakeMode)) {
      return;
    }

    setMode(nextMode as IntakeMode);
    resetRecommendationState();
  }

  function handleInputChange(nextInput: string) {
    setInput(nextInput);
    resetRecommendationState();
  }

  function resetRecommendationState() {
    setResult(null);
    setStatusMessage(null);
    setSessionId(null);
    setIsSaved(false);
    setMemoryStatus(null);
    setMemoryDeclined(false);
    setEscalationStatus(null);
  }

  function handleRecordingToggle() {
    setIsRecording((current) => !current);
  }

  function useSamplePrompt() {
    setInput(modeCopy[mode].sample);
    resetRecommendationState();
    inputRef.current?.focus();
  }

  function speakIntro() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "我會先檢查緊急警號，再一步一步建議下一步。I will check urgent warning signs first.",
    );
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSubmit() {
    const trimmedInput = input.trim();

    if (!trimmedInput || isSubmitting) {
      inputRef.current?.focus();
      return;
    }

    const deterministicResult = analyzeIntake(mode, trimmedInput);

    setIsSubmitting(true);
    setStatusMessage(null);
    setSessionId(null);
    setIsSaved(false);
    setMemoryStatus(null);
    setMemoryDeclined(false);
    setEscalationStatus(null);
    setResult(
      deterministicResult.urgency.level === 1 ? deterministicResult : null,
    );

    try {
      const response = await fetch("/api/navigation/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmedInput, mode }),
      });

      if (!response.ok) {
        throw new Error(`Guide request failed with ${response.status}`);
      }

      const payload = (await response.json()) as NavigationGuideResponse;
      setResult(payload.recommendation);
    } catch {
      setResult(deterministicResult);
      setStatusMessage(
        "Showing safe rule-based guidance while AI is unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveRecommendation() {
    if (!result || result.urgency.level === 1) {
      return;
    }

    startSaveTransition(async () => {
      try {
        setMemoryStatus("正在保存... Saving with consent...");
        await ensureUserReady();

        const sessionResponse = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input,
            language,
            recommendation: result,
            consentGranted: true,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error(await getErrorMessage(sessionResponse));
        }

        const sessionPayload = (await sessionResponse.json()) as {
          sessionId: string;
        };
        setSessionId(sessionPayload.sessionId);

        const recommendationResponse = await fetch("/api/recommendations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionPayload.sessionId,
            recommendation: result,
            consentGranted: true,
          }),
        });

        if (!recommendationResponse.ok) {
          throw new Error(await getErrorMessage(recommendationResponse));
        }

        setIsSaved(true);
        setMemoryStatus("已保存今次建議。Saved with consent.");
        toast.success("已保存 / Saved");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save.";
        setMemoryStatus(message);
        toast.error(message);
      }
    });
  }

  function handleEscalationRequest() {
    if (!result || result.urgency.level === 1) {
      return;
    }

    startSaveTransition(async () => {
      try {
        setEscalationStatus("正在建立人工覆核個案... Requesting review...");
        await ensureUserReady();

        const response = await fetch("/api/escalations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            recommendation: result,
            reason: result.escalation,
            consentGranted: true,
          }),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        setEscalationStatus(
          "已記錄人工覆核意向。A human review handoff has been recorded.",
        );
        toast.success("已記錄 handoff / Handoff recorded");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not request handoff.";
        setEscalationStatus(message);
        toast.error(message);
      }
    });
  }

  async function ensureUserReady() {
    if (!supabase) {
      throw new Error("Supabase is not configured, so cloud memory is unavailable.");
    }

    if (user) {
      return user;
    }

    const { data, error } = await supabase.auth.signInAnonymously();

    const signedInUser = data.user;

    if (error || !signedInUser) {
      throw new Error(error?.message ?? "Could not start anonymous account.");
    }

    setUser(signedInUser);

    const createdProfile = await import("@/lib/user-memory").then((module) =>
      module.getOrCreateProfile(signedInUser, supabase),
    );
    setProfile(createdProfile);

    return signedInUser;
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">香港 / Hong Kong</Badge>
              <Badge variant={supabase ? "secondary" : "outline"}>
                {supabase
                  ? "雲端記憶可用 / Memory ready"
                  : "本機安全模式 / Local safe mode"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                AI 醫療及保險導航
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                繁體中文優先，英文第二。先分流安全風險，再協助你整理下一步、可能相關部門及保障類型。
                <br />
                Traditional Chinese first, English second. Navigation support,
                not diagnosis or regulated insurance advice.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LockKeyhole data-icon="inline-start" aria-hidden="true" />
                  資料如何保存
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>資料保存及安全 / Data storage</DialogTitle>
                  <DialogDescription>
                    匿名使用可以即時開始；只有在你按下保存後，才會建立雲端紀錄。
                  </DialogDescription>
                </DialogHeader>
                <DataPolicyContent />
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <UserRoundPlus data-icon="inline-start" aria-hidden="true" />
                  登入 / Save
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>匿名使用或登入 / Anonymous or login</SheetTitle>
                  <SheetDescription>
                    你可以先使用，再決定是否保存紀錄或升級帳戶。
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="mt-4 h-[calc(100svh-8rem)] pr-4">
                  <AuthPanel
                    supabase={supabase}
                    user={user}
                    variant={user ? "upgrade" : "start"}
                    onUserReady={setUser}
                    onProfileReady={setProfile}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)] lg:items-start">
          <div className="flex flex-col gap-5">
            <Tabs value={mode} onValueChange={handleModeChange}>
              <TabsList className="grid h-auto w-full grid-cols-3">
                <TabsTrigger value="medical">
                  <Stethoscope data-icon="inline-start" aria-hidden="true" />
                  醫療導航
                </TabsTrigger>
                <TabsTrigger value="insurance">
                  <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                  Insurance
                </TabsTrigger>
                <TabsTrigger value="policy">
                  <FileText data-icon="inline-start" aria-hidden="true" />
                  Policy
                </TabsTrigger>
              </TabsList>

              {modeValues.map((tabMode) => (
                <TabsContent key={tabMode} value={tabMode} className="mt-4">
                  <Card className="border-border/70">
                    <CardHeader className="gap-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-col gap-1">
                          <CardTitle>{modeCopy[tabMode].label}</CardTitle>
                          <CardDescription className="leading-6">
                            {modeCopy[tabMode].description}
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={useSamplePrompt}
                        >
                          使用例子 / Example
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                      <PreferenceControls
                        language={language}
                        carePreference={carePreference}
                        onLanguageChange={setLanguage}
                        onCarePreferenceChange={setCarePreference}
                      />

                      <form
                        className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSubmit();
                        }}
                      >
                        <Textarea
                          ref={inputRef}
                          value={input}
                          rows={4}
                          placeholder={selectedModeCopy.placeholder}
                          aria-label="Describe your symptom, care question, insurance question, or policy question"
                          onChange={(event) =>
                            handleInputChange(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (
                              (event.metaKey || event.ctrlKey) &&
                              event.key === "Enter"
                            ) {
                              void handleSubmit();
                            }
                          }}
                        />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant={isRecording ? "secondary" : "outline"}
                                  size="icon"
                                  aria-label={
                                    isRecording
                                      ? "Stop voice input"
                                      : "Start voice input"
                                  }
                                  aria-pressed={isRecording}
                                  onClick={handleRecordingToggle}
                                >
                                  <Mic aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                語音狀態示意 / Voice state preview
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Speak intro"
                              onClick={speakIntro}
                            >
                              <Volume2 aria-hidden="true" />
                            </Button>

                            <p className="text-xs text-muted-foreground">
                              先檢查急症警號 / Urgent signs first
                            </p>
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting || input.trim().length === 0}
                          >
                            <ArrowUp data-icon="inline-start" aria-hidden="true" />
                            分析 / Analyze
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <StatusStrip
              isSubmitting={isSubmitting}
              result={result}
              statusMessage={statusMessage}
            />

            {isSubmitting && !result ? <LoadingResult /> : null}
            {result ? (
              <RecommendationView
                recommendation={result}
                isSameDayCare={Boolean(isSameDayCare)}
                onEscalate={handleEscalationRequest}
                escalationStatus={escalationStatus}
                isSaving={isSaving}
              />
            ) : null}

            {result && canOfferMemory ? (
              <MemoryConsentCard
                canSave={Boolean(supabase) && !isSaved}
                isSaved={isSaved}
                isSaving={isSaving}
                status={memoryStatus}
                onSave={handleSaveRecommendation}
                onDecline={() => {
                  setMemoryDeclined(true);
                  setMemoryStatus("今次不保存。Not saved this time.");
                }}
              />
            ) : null}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
            <Card className="overflow-hidden border-border/70">
              <CardContent className="flex flex-col gap-3 p-0">
                <div className="min-h-[360px] bg-muted/35">
                  <HumanDoctor3D
                    state={doctorAffect.state}
                    emotion={doctorAffect.emotion}
                    className="mx-auto"
                  />
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <Badge
                    variant={isEmergency ? "destructive" : "secondary"}
                    className="w-fit"
                  >
                    {doctorAffect.state === "ready"
                      ? "Ready"
                      : doctorAffect.state}
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">
                    AI 醫療導航，不取代醫生診斷。緊急情況會減少動畫並優先顯示急症指示。
                    <br />
                    AI healthcare navigation only. Not a replacement for a
                    clinician or licensed insurance adviser.
                  </p>
                </div>
              </CardContent>
            </Card>

            <OperationalChecklist
              supabase={supabase}
              user={user}
              profile={profile}
              carePreference={carePreference}
              language={language}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}

function PreferenceControls({
  language,
  carePreference,
  onLanguageChange,
  onCarePreferenceChange,
}: {
  language: LanguagePreference;
  carePreference: CarePreference;
  onLanguageChange: (value: LanguagePreference) => void;
  onCarePreferenceChange: (value: CarePreference) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(160px,220px)_1fr]">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">語言 / Language</label>
        <Select
          value={language}
          onValueChange={(value) => onLanguageChange(value as LanguagePreference)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {language === "zh-Hant" ? "繁體中文 first" : "English second"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Language</SelectLabel>
              <SelectItem value="zh-Hant">繁體中文 first</SelectItem>
              <SelectItem value="en">English second</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          公營或私營偏好 / Care preference
        </label>
        <ToggleGroup
          type="single"
          value={carePreference}
          variant="outline"
          spacing={1}
          onValueChange={(value) => {
            if (value) {
              onCarePreferenceChange(value as CarePreference);
            }
          }}
          className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <ToggleGroupItem className="w-full justify-start rounded-lg" value="public">
            公營 / Public
          </ToggleGroupItem>
          <ToggleGroupItem className="w-full justify-start rounded-lg" value="private">
            私營 / Private
          </ToggleGroupItem>
          <ToggleGroupItem className="w-full justify-start rounded-lg" value="either">
            按情況 / Either
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

function StatusStrip({
  isSubmitting,
  result,
  statusMessage,
}: {
  isSubmitting: boolean;
  result: Recommendation | null;
  statusMessage: string | null;
}) {
  if (!isSubmitting && !result && !statusMessage) {
    return (
      <Alert>
        <Brain data-icon="inline-start" aria-hidden="true" />
        <AlertTitle>可即時開始 / Start immediately</AlertTitle>
        <AlertDescription>
          不需要先登入。輸入問題後，系統會先用安全規則判斷緊急程度。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={result?.urgency.level === 1 ? "destructive" : "default"}>
      {result?.urgency.level === 1 ? (
        <AlertTriangle data-icon="inline-start" aria-hidden="true" />
      ) : (
        <ClipboardCheck data-icon="inline-start" aria-hidden="true" />
      )}
      <AlertTitle>
        {isSubmitting
          ? "正在分析症狀及緊急程度 / Checking symptoms and urgency"
          : result?.urgency.label ?? "Rule-based guidance"}
      </AlertTitle>
      <AlertDescription>
        {statusMessage ??
          result?.urgency.summary ??
          "AI route is checking the deterministic recommendation."}
      </AlertDescription>
    </Alert>
  );
}

function LoadingResult() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

function RecommendationView({
  recommendation,
  isSameDayCare,
  onEscalate,
  escalationStatus,
  isSaving,
}: {
  recommendation: Recommendation;
  isSameDayCare: boolean;
  onEscalate: () => void;
  escalationStatus: string | null;
  isSaving: boolean;
}) {
  const isEmergency = recommendation.urgency.level === 1;
  const showInsurance =
    recommendation.mode === "insurance" ||
    recommendation.mode === "policy" ||
    recommendation.insuranceCategories.length > 0;

  if (isEmergency) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <Alert variant="destructive" className="border-destructive/50">
            <AlertTriangle data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>緊急 / Emergency</AlertTitle>
            <AlertDescription>
              {recommendation.assistantMessage || recommendation.urgency.summary}
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild variant="destructive" size="lg">
            <a href="tel:999">
              <AlertTriangle data-icon="inline-start" aria-hidden="true" />
              致電 999 / Call 999
            </a>
          </Button>
          <p className="text-lg font-semibold">{recommendation.nextAction}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {recommendation.careRoute}
          </p>
          <Separator />
          <p className="text-sm text-muted-foreground">
            不會保存緊急查詢記憶。Emergency guidance is not saved from this
            flow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isSameDayCare ? "destructive" : "secondary"}>
              {recommendation.urgency.label}
            </Badge>
            <Badge variant="outline">{recommendation.classification}</Badge>
            {recommendation.ai?.status ? (
              <Badge variant="outline">AI: {recommendation.ai.status}</Badge>
            ) : null}
          </div>
          <CardTitle>下一步 / Next action</CardTitle>
          <CardDescription className="text-base leading-7">
            {recommendation.assistantMessage || recommendation.urgency.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoPanel
            icon={HeartPulse}
            title="建議行動 / What to do"
            items={[recommendation.nextAction]}
          />
          <InfoPanel
            icon={Stethoscope}
            title="醫療路徑 / Care route"
            items={[recommendation.careRoute]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanelCard
          title="可能相關部門 / Possible departments"
          items={recommendation.possibleDepartments}
        />
        <InfoPanelCard
          title="準備及檢查 / Checklist"
          items={recommendation.decisionChecklist}
        />
      </div>

      {showInsurance ? (
        <InsuranceGuidanceCard recommendation={recommendation} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>升級處理及免責 / Escalation and disclaimer</CardTitle>
          <CardDescription>
            高風險醫療或保險決策需要真人專業人士覆核。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert>
            <ShieldCheck data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>升級處理 / Escalation</AlertTitle>
            <AlertDescription>{recommendation.escalation}</AlertDescription>
          </Alert>
          <p className="text-sm leading-6 text-muted-foreground">
            {recommendation.disclaimer}
          </p>
          {escalationStatus ? (
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {escalationStatus}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onEscalate}
          >
            <UserRoundPlus data-icon="inline-start" aria-hidden="true" />
            人工覆核 / Human review
          </Button>
          <FollowupDrawer questions={recommendation.questions} />
        </CardFooter>
      </Card>
    </div>
  );
}

function InsuranceGuidanceCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>保障類型導航 / Coverage category guidance</CardTitle>
        <CardDescription>
          只列保障類型和比較準則，不作具體產品銷售建議。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <InfoPanel
          icon={ShieldCheck}
          title="優先考慮 / Priority"
          items={recommendation.insuranceGuidance.priority}
        />
        <InfoPanel
          icon={BookOpenCheck}
          title="有用附加 / Add-ons"
          items={recommendation.insuranceGuidance.addOns}
        />
        <InfoPanel
          icon={FileText}
          title="特定情況 / Situational"
          items={recommendation.insuranceGuidance.situational}
        />
      </CardContent>
      <Separator />
      <CardContent className="pt-4">
        <InfoPanel
          icon={ClipboardCheck}
          title="購買前應查問 / Questions before buying"
          items={recommendation.insuranceGuidance.questionsBeforeBuying}
        />
      </CardContent>
    </Card>
  );
}

function InfoPanelCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BulletList items={items} />
      </CardContent>
    </Card>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof HeartPulse;
  title: string;
  items: string[];
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </div>
      <BulletList items={items} />
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  const safeItems = items.filter(Boolean);

  if (safeItems.length === 0) {
    return <p className="text-sm text-muted-foreground">暫無 / None</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
      {safeItems.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 size-1.5 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FollowupDrawer({ questions }: { questions: string[] }) {
  const shownQuestions = questions.slice(0, 3);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="ghost" disabled={shownQuestions.length === 0}>
          <ClipboardCheck data-icon="inline-start" aria-hidden="true" />
          追問資料 / Follow-up
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>下一步可補充資料 / Useful follow-up</DrawerTitle>
          <DrawerDescription>
            AI 每次只追問必要資料，避免冗長問診。
          </DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-6">
          <BulletList items={shownQuestions} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function OperationalChecklist({
  supabase,
  user,
  profile,
  carePreference,
  language,
}: {
  supabase: SupabaseClient | null;
  user: User | null;
  profile: Profile | null;
  carePreference: CarePreference;
  language: LanguagePreference;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">MVP 安全狀態 / Safety status</CardTitle>
        <CardDescription>匿名優先，保存前清楚確認。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <StatusRow
          label="登入狀態 / Session"
          value={
            user
              ? user.is_anonymous
                ? "匿名帳戶 / Anonymous"
                : "已登入 / Logged in"
              : "未登入也可使用 / Usable without login"
          }
        />
        <StatusRow
          label="雲端保存 / Cloud memory"
          value={supabase ? "可用 / Available" : "未設定 / Not configured"}
        />
        <StatusRow
          label="語言 / Language"
          value={language === "zh-Hant" ? "繁體中文 first" : "English second"}
        />
        <StatusRow
          label="偏好 / Preference"
          value={
            carePreference === "public"
              ? "公營 / Public"
              : carePreference === "private"
                ? "私營 / Private"
                : "按情況 / Either"
          }
        />
        {profile ? (
          <StatusRow
            label="Profile"
            value={profile.display_name ?? profile.preferred_language}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/25 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function DataPolicyContent() {
  return (
    <div className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
      <p>
        你可以匿名使用本服務。匿名模式適合初步查詢，但如果你登出、清除瀏覽器資料或更換裝置，可能無法再次取回紀錄。
      </p>
      <p>
        建立帳戶可保存偏好、家庭成員資料及保險分析。系統不會自動保存未確認診斷、敏感病歷、HKID、完整保單號碼或付款資料。
      </p>
      <p>
        You can use this service anonymously. Creating an account lets you save
        preferences, household profiles, and insurance assessments after
        consent.
      </p>
    </div>
  );
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

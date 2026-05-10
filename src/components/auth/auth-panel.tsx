"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Mail, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import {
  GOOGLE_OAUTH_ENABLED,
  anonymousModeCopy,
  getAnonymousStartState,
} from "@/lib/auth-flow";
import { getAuthRedirectTo } from "@/lib/supabase/client";
import { getOrCreateProfile, type Profile } from "@/lib/user-memory";

type AuthPanelProps = {
  supabase: SupabaseClient | null;
  user: User | null;
  variant?: "start" | "upgrade";
  onUserReady: (user: User) => void;
  onProfileReady: (profile: Profile) => void;
};

export function AuthPanel({
  supabase,
  user,
  variant = "start",
  onUserReady,
  onProfileReady,
}: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isUpgrade = variant === "upgrade" || Boolean(user?.is_anonymous);
  const anonymousStart = getAnonymousStartState(email);
  const isDisabled = !supabase || isPending;

  function startAnonymous() {
    if (!supabase) {
      setError("Supabase 尚未設定。Supabase is not configured yet.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setStatus("正在建立匿名帳戶... Creating anonymous account...");

      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();

      if (signInError || !data.user) {
        setError(
          signInError?.message ??
            "未能建立匿名帳戶。Could not create anonymous account.",
        );
        setStatus(null);
        return;
      }

      const profile = await getOrCreateProfile(data.user, supabase);
      onUserReady(data.user);
      onProfileReady(profile);
      setStatus("已匿名開始，可選擇保存今次紀錄。Anonymous mode is ready.");
    });
  }

  function continueWithEmail() {
    if (!supabase) {
      setError("Supabase 尚未設定。Supabase is not configured yet.");
      return;
    }

    if (!email.trim()) {
      setError("請輸入電郵地址。Enter an email address.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setStatus(
        isUpgrade
          ? "正在發送帳戶升級確認電郵... Sending account upgrade email..."
          : "正在發送登入連結... Sending magic link...",
      );

      const redirectTo = getAuthRedirectTo();
      const result =
        isUpgrade && user?.is_anonymous
          ? await supabase.auth.updateUser(
              { email: email.trim() },
              { emailRedirectTo: redirectTo },
            )
          : await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: { emailRedirectTo: redirectTo },
            });

      if (result.error) {
        setError(result.error.message);
        setStatus(null);
        return;
      }

      setStatus(
        isUpgrade
          ? "請查看電郵完成升級；如專案未啟用身份連結，系統不會破壞現有匿名紀錄。Check your email to finish upgrading. Existing anonymous history is kept intact."
          : "請查看電郵登入連結。Check your email for the magic link.",
      );
    });
  }

  function continueWithGoogle() {
    if (!supabase || !GOOGLE_OAUTH_ENABLED) {
      return;
    }

    startTransition(async () => {
      const redirectTo = getAuthRedirectTo();
      const result =
        isUpgrade && user?.is_anonymous
          ? await supabase.auth.linkIdentity({
              provider: "google",
              options: { redirectTo },
            })
          : await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo },
            });

      if (result.error) {
        setError(result.error.message);
      }
    });
  }

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserRoundPlus aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit">
                {isUpgrade ? "Account upgrade" : "Optional login"}
              </Badge>
              <CardTitle className="text-lg">
                {isUpgrade
                  ? "保存紀錄並建立帳戶 / Save history and create account"
                  : "先用，再決定是否登入 / Use first, log in when ready"}
              </CardTitle>
            </div>
          </div>
        </div>
        <CardDescription className="leading-6">
          {anonymousModeCopy.zh}
          <br />
          {anonymousModeCopy.en}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!supabase ? (
          <Alert>
            <ShieldCheck data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>本機雲端記憶未啟用 / Cloud memory unavailable</AlertTitle>
            <AlertDescription>
              尚未設定 Supabase public URL / publishable key。你仍可使用導航，但不會保存雲端紀錄。
            </AlertDescription>
          </Alert>
        ) : null}

        {!isUpgrade ? (
          <Button
            type="button"
            disabled={isDisabled || !anonymousStart.canStart}
            onClick={startAnonymous}
          >
            匿名開始 / Start anonymously
          </Button>
        ) : null}

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/35 p-3 text-sm leading-6 text-muted-foreground">
          <p>
            只會在你同意後保存語言、公私營偏好、保險狀況、家庭背景和已保存建議。不會自動保存未確認診斷、詳細病歷、HKID、完整保單號碼或付款資料。
          </p>
          <p>
            Memory is saved only with consent: language, care preference,
            insurance context, household context, and saved recommendations.
          </p>
        </div>

        <Separator />

        <label className="text-sm font-medium" htmlFor={isUpgrade ? "upgrade-email" : "auth-email"}>
          電郵 / Email
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={isUpgrade ? "upgrade-email" : "auth-email"}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled}
            onClick={continueWithEmail}
          >
            <Mail data-icon="inline-start" aria-hidden="true" />
            {isUpgrade ? "升級 / Upgrade" : "電郵登入 / Email"}
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={isDisabled || !GOOGLE_OAUTH_ENABLED}
          onClick={continueWithGoogle}
        >
          <ShieldCheck data-icon="inline-start" aria-hidden="true" />
          使用 Google 登入 / Continue with Google
          {!GOOGLE_OAUTH_ENABLED ? "（待啟用 / disabled）" : ""}
        </Button>

        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

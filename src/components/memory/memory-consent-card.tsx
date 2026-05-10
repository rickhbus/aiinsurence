"use client";

import { DatabaseZap, Eye, Save } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type MemoryConsentCardProps = {
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  status: string | null;
  onSave: () => void;
  onDecline: () => void;
};

export function MemoryConsentCard({
  canSave,
  isSaved,
  isSaving,
  status,
  onSave,
  onDecline,
}: MemoryConsentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <DatabaseZap aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              保存今次建議 / Save this recommendation
            </CardTitle>
            <CardDescription className="leading-6">
              我可以記住你的語言偏好、公私營醫療偏好、保險狀況及今次建議，方便下次提供更貼近你的建議。是否保存？
              <br />I can remember your language preference, care preference,
              insurance status, and this recommendation. Save this?
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {showDetails ? (
          <Alert>
            <Eye data-icon="inline-start" aria-hidden="true" />
            <AlertTitle>會保存甚麼 / What will be saved</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 leading-6">
              <span>
                會保存：語言偏好、公私營醫療偏好、保險狀況、家庭/同行者背景、今次導航建議和交接意願。
              </span>
              <span>
                不會自動保存：未確認診斷、詳細敏感病歷、精神健康危機細節、HKID、完整保單號碼、信用卡或付款資料。
              </span>
              <span>
                Saved with consent: language, care preference, insurance
                context, household context, this recommendation, and adviser
                handoff preference.
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        {status ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
            {status}
          </p>
        ) : null}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={!canSave || isSaved || isSaving}
          onClick={onSave}
        >
          <Save data-icon="inline-start" aria-hidden="true" />
          {isSaved ? "已保存 / Saved" : "保存 / Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onDecline}
        >
          今次不要 / Not now
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((current) => !current)}
        >
          <Eye data-icon="inline-start" aria-hidden="true" />
          查看會保存甚麼 / See what will be saved
        </Button>
      </CardFooter>
    </Card>
  );
}

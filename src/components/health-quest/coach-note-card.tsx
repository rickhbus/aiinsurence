import { MessageCircleHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function CoachNoteCard({
  state,
  locale,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
}) {
  return (
    <Card className="border-border/60 bg-card/82 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircleHeart aria-hidden="true" className="text-primary" />
          Coach note / 教練提示
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {text(state.coachNote, locale)}
      </CardContent>
    </Card>
  );
}

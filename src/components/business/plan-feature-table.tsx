import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlanFeatureTable() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader><CardTitle>Family care features</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr><th className="py-2">Feature</th><th>Basic / Free</th><th>Care</th><th>Family Care</th></tr>
          </thead>
          <tbody>
            {[
              ["一鍵每日記錄", "Yes", "Yes", "Yes"],
              ["緊急 999 提示", "Yes", "Yes", "Yes"],
              ["每日安心", "7 日基本紀錄", "每日簡短 AI 建議", "家庭 check-in 狀態"],
              ["更容易準備覆診", "No", "基本醫生摘要", "doctor report export"],
              ["屋企人知道今日有冇 check-in", "Preview", "Preview", "Yes"],
              ["Weekly family report", "No", "No", "Family Care"],
              ["Insurance document checklist", "No", "No", "Family Care"],
              ["Consent caregiver sharing", "No", "No", "Yes"],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-border/60">
                {row.map((cell) => <td key={cell} className="py-3 pr-4">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

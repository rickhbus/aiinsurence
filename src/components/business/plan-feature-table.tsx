import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlanFeatureTable() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader><CardTitle>Entitlement model</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr><th className="py-2">Feature</th><th>Free</th><th>Plus</th><th>Pro</th><th>Family</th></tr>
          </thead>
          <tbody>
            {[
              ["Daily check-in", "Yes", "Yes", "Yes", "Yes"],
              ["AI daily summary", "Limited", "Yes", "Yes", "Yes"],
              ["Doctor export", "No", "No", "Yes", "Yes"],
              ["Caregiver sharing", "No", "No", "No", "Consent only"],
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "HK$0",
    features: ["Daily check-in", "Basic mood log", "Basic gym log", "Limited history", "Safety navigation"],
  },
  {
    name: "Plus",
    price: "HK$58/month",
    features: ["AI daily summary", "Food insights", "Mood coach", "Gym templates", "Weekly report"],
  },
  {
    name: "Pro",
    price: "HK$128/month",
    features: ["Advanced trends", "Gym progression", "Doctor summary export", "Insurance document checklist", "Deeper history"],
  },
  {
    name: "Family",
    price: "HK$198/month",
    features: ["4-6 members", "Consent caregiver sharing", "Family dashboard", "Elder/child placeholders", "Family reports"],
  },
  {
    name: "Gym/PT Partner",
    price: "Contact sales",
    features: ["Lead capture", "Member workout logs", "Adherence reports", "Trainer dashboard placeholder"],
  },
  {
    name: "Employer Wellness",
    price: "Contact sales",
    features: ["Privacy-safe aggregate wellness", "Challenges", "Stress education", "No individual disclosure"],
  },
];

export function PricingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.name} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{plan.name}</CardTitle>
              {plan.name === "Plus" ? <Badge>Popular</Badge> : null}
            </div>
            <p className="text-2xl font-bold tracking-normal">{plan.price}</p>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            {plan.features.map((feature) => <p key={feature}>{feature}</p>)}
          </CardContent>
          <CardFooter>
            <Button variant={plan.name === "Plus" ? "default" : "outline"} className="w-full">
              Mock entitlement / 未接駁付款
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

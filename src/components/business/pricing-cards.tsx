"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

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

type PaymentConfigResponse = {
  configured: boolean;
  plans: Array<{
    id: string;
    checkoutEnabled: boolean;
  }>;
};

export function PricingCards() {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/payments/config", { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((body) => {
        if (active) {
          setPaymentConfig(body);
        }
      })
      .catch(() => {
        if (active) {
          setPaymentConfig({ configured: false, plans: [] });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function startCheckout(planName: string) {
    const plan = planName.toLowerCase();
    setLoadingPlan(plan);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ plan }),
      });
      const body = await response.json().catch(() => null);

      if (response.ok && typeof body?.url === "string") {
        window.location.href = body.url;
      }
    } finally {
      setLoadingPlan(null);
    }
  }

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
            <PricingAction
              planName={plan.name}
              configured={Boolean(paymentConfig?.configured)}
              checkoutEnabled={Boolean(paymentConfig?.plans.some((item) => item.id === plan.name.toLowerCase() && item.checkoutEnabled))}
              loading={loadingPlan === plan.name.toLowerCase()}
              onCheckout={() => startCheckout(plan.name)}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PricingAction({
  planName,
  configured,
  checkoutEnabled,
  loading,
  onCheckout,
}: {
  planName: string;
  configured: boolean;
  checkoutEnabled: boolean;
  loading: boolean;
  onCheckout: () => void;
}) {
  if (planName === "Free" || planName.includes("Partner") || planName.includes("Employer")) {
    return (
      <Button variant="outline" className="w-full" disabled>
        目前方案 / Current option
      </Button>
    );
  }

  if (!configured || !checkoutEnabled) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Payment not configured
      </Button>
    );
  }

  return (
    <Button
      variant={planName === "Plus" ? "default" : "outline"}
      className="w-full"
      disabled={loading}
      onClick={onCheckout}
    >
      {loading ? "Opening checkout" : "Subscribe / 付款"}
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

const plans = [
  {
    id: "free",
    name: "Basic / Free",
    price: "HK$0",
    badge: null,
    features: ["一鍵每日記錄", "緊急 999 提示", "7 日基本紀錄"],
  },
  {
    id: "care",
    name: "Plus / Care",
    price: "HK$58/month",
    badge: "每日安心 / Daily support",
    features: ["每日簡短 AI 建議", "飲食 / 飲水 / 心情 / 活動記錄", "基本醫生摘要", "不影響保險資格、定價或索償"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "HK$128/month",
    badge: "進階準備 / Advanced prep",
    features: ["長期趨勢", "進階醫生摘要", "個人化學習路徑", "Gym / recovery insights"],
  },
  {
    id: "family",
    name: "Family Care",
    price: "HK$198/month",
    badge: "最適合照顧爸爸媽媽 / Best for caring for parents",
    features: [
      "最適合照顧爸爸媽媽",
      "4–6 family members",
      "家庭 check-in 狀態",
      "consent caregiver sharing",
      "doctor report export",
      "weekly family report",
      "insurance document checklist",
      "屋企人知道今日有冇 check-in",
    ],
  },
  {
    id: "partner",
    name: "Gym/PT Partner",
    price: "Contact sales",
    badge: null,
    features: ["Lead capture", "Member workout logs", "Adherence reports", "Trainer dashboard placeholder"],
  },
  {
    id: "employer",
    name: "Employer Wellness",
    price: "Contact sales",
    badge: null,
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

  async function startCheckout(planId: string) {
    setLoadingPlan(planId);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ plan: planId }),
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
        <Card key={plan.id} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{plan.name}</CardTitle>
              {plan.badge ? <Badge>{plan.badge}</Badge> : null}
            </div>
            <p className="text-2xl font-bold tracking-normal">{plan.price}</p>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            {plan.features.map((feature) => <p key={feature}>{feature}</p>)}
          </CardContent>
          <CardFooter>
            <PricingAction
              planId={plan.id}
              configured={Boolean(paymentConfig?.configured)}
              checkoutEnabled={Boolean(paymentConfig?.plans.some((item) => item.id === plan.id && item.checkoutEnabled))}
              loading={loadingPlan === plan.id}
              onCheckout={() => startCheckout(plan.id)}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PricingAction({
  planId,
  configured,
  checkoutEnabled,
  loading,
  onCheckout,
}: {
  planId: string;
  configured: boolean;
  checkoutEnabled: boolean;
  loading: boolean;
  onCheckout: () => void;
}) {
  if (planId === "free" || planId === "pro" || planId === "partner" || planId === "employer") {
    return (
      <Button variant="outline" className="w-full" disabled>
        {planId === "pro" ? "Roadmap / 即將推出" : "目前方案 / Current option"}
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
      variant={planId === "family" ? "default" : "outline"}
      className="w-full"
      disabled={loading}
      onClick={onCheckout}
    >
      {loading ? "Opening checkout" : "Subscribe / 付款"}
    </Button>
  );
}

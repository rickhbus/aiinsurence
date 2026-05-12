"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultFamilyShareScopes, familyShareScopes, type FamilyShareScope } from "@/lib/family/sharing";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

type FamilyState = {
  memberships: Array<{
    id: string;
    role: string;
    family_groups?: { id: string; name: string } | null;
  }>;
  invites: Array<{ id: string; invited_email: string; status: string }>;
  consents: Array<{ id: string; scopes: string[]; grantee_email: string | null; revoked_at: string | null }>;
};

const scopeLabels: Record<FamilyShareScope, string> = {
  safety_status: "安全狀態 / Safety status",
  daily_checkin_completion: "今日有否完成記錄 / Daily check-in completion",
  emergency_contact: "緊急聯絡資料 / Emergency contact",
  hydration_summary: "補水摘要 / Hydration summary",
  meal_summary: "飲食摘要 / Meal summary",
  workout_summary: "運動摘要 / Workout summary",
  mood_summary: "心情摘要 / Mood summary",
};

export function FamilySharingPanel() {
  const [state, setState] = useState<FamilyState | null>(null);
  const [groupName, setGroupName] = useState("My family");
  const [inviteEmail, setInviteEmail] = useState("");
  const [granteeEmail, setGranteeEmail] = useState("");
  const [emergencyContactInfo, setEmergencyContactInfo] = useState("");
  const [scopes, setScopes] = useState<FamilyShareScope[]>(defaultFamilyShareScopes);
  const [busy, setBusy] = useState(false);
  const firstGroupId = useMemo(
    () => state?.memberships[0]?.family_groups?.id ?? null,
    [state],
  );

  const refresh = useCallback(async () => {
    const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
    const response = await fetch("/api/family", { headers });
    const body = await response.json().catch(() => null);

    if (response.ok) {
      setState(body);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function post(action: Record<string, unknown>) {
    setBusy(true);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      await fetch("/api/family", {
        method: "POST",
        headers,
        body: JSON.stringify(action),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleScope(scope: FamilyShareScope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>家庭群組 / Family group</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            <Button disabled={busy} onClick={() => post({ action: "create_group", name: groupName })}>
              建立家庭群組 / Create group
            </Button>
          </div>
          <div className="grid gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="family@example.com"
            />
            <Button
              variant="outline"
              disabled={busy || !firstGroupId || !inviteEmail}
              onClick={() => post({ action: "invite_member", groupId: firstGroupId, email: inviteEmail })}
            >
              邀請成員 / Invite member
            </Button>
          </div>
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            {(state?.memberships ?? []).map((membership) => (
              <p key={membership.id}>
                {membership.family_groups?.name ?? "Family"} - {membership.role}
              </p>
            ))}
            {state && state.memberships.length === 0 ? <p>未建立家庭群組。</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>同意分享 / Sharing consent</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            type="email"
            value={granteeEmail}
            onChange={(event) => setGranteeEmail(event.target.value)}
            placeholder="caregiver@example.com"
          />
          <Textarea
            value={emergencyContactInfo}
            onChange={(event) => setEmergencyContactInfo(event.target.value)}
            placeholder="緊急聯絡資料可留空 / Emergency contact optional"
          />
          <div className="grid gap-2">
            {familyShareScopes.map((scope) => (
              <label key={scope} className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={scopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                />
                <span>{scopeLabels[scope]}</span>
              </label>
            ))}
          </div>
          <Button
            disabled={busy || !firstGroupId}
            onClick={() =>
              post({
                action: "set_consent",
                groupId: firstGroupId,
                granteeEmail: granteeEmail || null,
                scopes,
                emergencyContactInfo,
              })
            }
          >
            保存同意 / Save consent
          </Button>
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            {(state?.consents ?? []).map((consent) => (
              <div key={consent.id} className="rounded-xl bg-muted/30 p-3">
                <p>{consent.grantee_email ?? "未指定照顧者 / No caregiver email"}</p>
                <p>{consent.scopes.join(", ")}</p>
                {consent.revoked_at ? (
                  <p>已撤回 / Revoked</p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={busy}
                    onClick={() => post({ action: "revoke_consent", consentId: consent.id })}
                  >
                    撤回 / Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl xl:col-span-2">
        <CardHeader>
          <CardTitle>待處理邀請 / Pending invites</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
          {(state?.invites ?? []).map((invite) => (
            <p key={invite.id}>{invite.invited_email} - {invite.status}</p>
          ))}
          {state && state.invites.length === 0 ? <p>暫時沒有待處理邀請。</p> : null}
          <p>不會自動分享；心情或較敏感資料預設不開啟，需要逐項同意。</p>
        </CardContent>
      </Card>
    </div>
  );
}

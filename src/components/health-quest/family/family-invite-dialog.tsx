"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { QuestLocale } from "@/lib/health-quest/types";

export function FamilyInviteDialog({ locale, onInvite }: { locale: QuestLocale; onInvite: (email: string) => void }) {
  const [email, setEmail] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Send data-icon="inline-start" aria-hidden="true" />
          {locale === "en" ? "Invite" : "邀請"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "en" ? "Invite family" : "邀請屋企人"}</DialogTitle>
        </DialogHeader>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        <Button type="button" onClick={() => onInvite(email)}>{locale === "en" ? "Send invite" : "送出邀請"}</Button>
      </DialogContent>
    </Dialog>
  );
}

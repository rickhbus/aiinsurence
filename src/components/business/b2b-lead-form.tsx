"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function B2BLeadForm() {
  const [leadType, setLeadType] = useState("gym");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/business/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          leadType,
          companyName: stringValue(data.get("companyName")),
          contactName: stringValue(data.get("contactName")),
          email: stringValue(data.get("email")),
          phone: stringValue(data.get("phone")),
          message: stringValue(data.get("message")),
          consentToContact: data.get("consentToContact") === "on",
        }),
      });

      if (!response.ok) {
        throw new Error("lead failed");
      }

      toast.success("已收到，我們會用你同意的聯絡方式跟進。");
      event.currentTarget.reset();
    } catch {
      toast.error("暫時未能提交，請稍後再試。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>B2B lead capture</CardTitle>
          <CardDescription>只收集合作聯絡資料，不收集健康、保單、索償或 HKID 資料。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            lead type
            <Select value={leadType} onValueChange={setLeadType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["gym", "personal_trainer", "employer", "clinic", "insurance_adviser", "other"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Field name="companyName" label="company name" />
          <Field name="contactName" label="contact name" />
          <Field name="email" label="email" type="email" />
          <Field name="phone" label="phone optional" />
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            message
            <Textarea name="message" maxLength={1500} />
          </label>
          <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-2">
            <input name="consentToContact" type="checkbox" className="mt-1" required />
            <span>I consent to be contacted about this business enquiry.</span>
          </label>
        </CardContent>
        <CardFooter>
          <Button disabled={saving}>{saving ? "Submitting" : "Submit lead"}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} required={name !== "phone"} />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

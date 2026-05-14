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
          <CardTitle>合作查詢 / Partnership enquiry</CardTitle>
          <CardDescription>只收集合作聯絡資料，不收集健康、保單、索償、付款或 HKID 資料。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            合作類型 / Lead type
            <Select value={leadType} onValueChange={setLeadType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {leadTypeOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Field name="companyName" label="公司 / Company" />
          <Field name="contactName" label="聯絡人 / Contact name" />
          <Field name="email" label="電郵 / Email" type="email" />
          <Field name="phone" label="電話（可選）/ Phone optional" required={false} />
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            合作重點 / Message
            <Textarea name="message" maxLength={1500} />
          </label>
          <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-2">
            <input name="consentToContact" type="checkbox" className="mt-1" required />
            <span>我同意就此合作查詢被聯絡。/ I consent to be contacted about this business enquiry.</span>
          </label>
        </CardContent>
        <CardFooter>
          <Button disabled={saving}>{saving ? "提交中 / Submitting" : "提交合作查詢 / Submit enquiry"}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const leadTypeOptions = [
  { value: "gym", label: "健身室 / Gym" },
  { value: "personal_trainer", label: "私人教練 / Personal trainer" },
  { value: "employer", label: "僱主健康 / Employer wellness" },
  { value: "clinic", label: "診所準備 / Clinic prep" },
  { value: "insurance_adviser", label: "保險教育合作 / Insurance education" },
  { value: "other", label: "其他 / Other" },
];

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} required={required} />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

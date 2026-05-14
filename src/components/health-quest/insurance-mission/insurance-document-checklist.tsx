"use client";

const docs = ["Policy category", "Receipts", "Referral letter", "Claim form", "Questions for adviser"];

export function InsuranceDocumentChecklist() {
  return (
    <div className="grid gap-2 rounded-3xl border border-border/60 bg-card/86 p-4">
      {docs.map((doc) => (
        <label key={doc} className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 rounded border-border" />
          {doc}
        </label>
      ))}
    </div>
  );
}

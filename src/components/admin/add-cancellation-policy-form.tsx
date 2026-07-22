"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCancellationPolicyAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function AddCancellationPolicyForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionFr, setDescriptionFr] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [rulesText, setRulesText] = useState(
    '[{ "daysBeforeCheckIn": 3, "refundPercent": 100 }]'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!nameEn) return;
    setError(null);
    let rules: unknown;
    try {
      rules = JSON.parse(rulesText);
    } catch {
      setError("Rules must be valid JSON");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCancellationPolicyAction(locale, {
        nameEn,
        nameFr,
        nameAr,
        descriptionEn,
        descriptionFr,
        descriptionAr,
        rules,
      });
      toast.success("Cancellation policy added");
      setNameEn("");
      setNameFr("");
      setNameAr("");
      setDescriptionEn("");
      setDescriptionFr("");
      setDescriptionAr("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
        <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Textarea
          placeholder="Description (EN)"
          rows={2}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
        />
        <Textarea
          placeholder="Description (FR)"
          rows={2}
          value={descriptionFr}
          onChange={(e) => setDescriptionFr(e.target.value)}
        />
        <Textarea
          placeholder="Description (AR)"
          rows={2}
          dir="rtl"
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          Rules (JSON array of {"{ daysBeforeCheckIn, refundPercent }"})
        </p>
        <Textarea
          className="font-mono text-xs"
          rows={4}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add policy
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCountryAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function AddCountryForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code || !nameEn) return;
    setIsSubmitting(true);
    try {
      await createCountryAction(locale, code.toUpperCase(), nameEn, nameFr, nameAr);
      toast.success("Country added");
      setCode("");
      setNameEn("");
      setNameFr("");
      setNameAr("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <Input placeholder="Code (e.g. MA)" value={code} onChange={(e) => setCode(e.target.value)} />
      <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
      <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
}

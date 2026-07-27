"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAmenityAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function AddAmenityForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<"HOTEL" | "ROOM" | "VEHICLE" | "GENERAL">("HOTEL");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code || !nameEn) return;
    setIsSubmitting(true);
    try {
      await createAmenityAction(locale, code.toUpperCase(), category, nameEn, nameFr, nameAr);
      toast.success(t("amenityAdded"));
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
      <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
      <Select
        items={{ HOTEL: "Hotel", ROOM: "Room", VEHICLE: "Vehicle", GENERAL: "General" }}
        value={category}
        onValueChange={(v) => v && setCategory(v as typeof category)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HOTEL">Hotel</SelectItem>
          <SelectItem value="ROOM">Room</SelectItem>
          <SelectItem value="VEHICLE">Vehicle</SelectItem>
          <SelectItem value="GENERAL">General</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
      <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
}

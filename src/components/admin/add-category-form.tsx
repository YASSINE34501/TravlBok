"use client";

import { useState } from "react";
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
import { createCategoryAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

export function AddCategoryForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [type, setType] = useState<"HOTEL_TYPE" | "VEHICLE_CATEGORY">("HOTEL_TYPE");
  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code || !nameEn) return;
    setIsSubmitting(true);
    try {
      await createCategoryAction(locale, type, code.toUpperCase(), nameEn, nameFr, nameAr);
      toast.success("Category added");
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
      <Select
        items={{ HOTEL_TYPE: "Hotel type", VEHICLE_CATEGORY: "Vehicle category" }}
        value={type}
        onValueChange={(v) => v && setType(v as typeof type)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HOTEL_TYPE">Hotel type</SelectItem>
          <SelectItem value="VEHICLE_CATEGORY">Vehicle category</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
      <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
      <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Add
      </Button>
    </div>
  );
}

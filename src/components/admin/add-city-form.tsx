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
import { createCityAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

type CountryOption = { id: string; code: string; name: string };

export function AddCityForm({
  locale,
  countries,
}: {
  locale: string;
  countries: CountryOption[];
}) {
  const router = useRouter();
  const [countryId, setCountryId] = useState(countries[0]?.id ?? "");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryItems = Object.fromEntries(countries.map((c) => [c.id, `${c.name} (${c.code})`]));

  async function handleSubmit() {
    if (!countryId || !nameEn) return;
    setIsSubmitting(true);
    try {
      await createCityAction(locale, countryId, nameEn, nameFr, nameAr);
      toast.success("City added");
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
      <Select items={countryItems} value={countryId} onValueChange={(v) => v && setCountryId(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              {country.name} ({country.code})
            </SelectItem>
          ))}
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

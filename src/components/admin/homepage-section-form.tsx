"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertHomepageSectionAction } from "@/domains/admin/actions";
import { useRouter } from "@/i18n/navigation";

type Section = {
  key: string;
  titleEn?: string;
  titleFr?: string;
  titleAr?: string;
  config: unknown;
  sortOrder: number;
  isActive: boolean;
};

export function HomepageSectionForm({
  locale,
  section,
}: {
  locale: string;
  section?: Section;
}) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [key, setKey] = useState(section?.key ?? "");
  const [titleEn, setTitleEn] = useState(section?.titleEn ?? "");
  const [titleFr, setTitleFr] = useState(section?.titleFr ?? "");
  const [titleAr, setTitleAr] = useState(section?.titleAr ?? "");
  const [configText, setConfigText] = useState(
    JSON.stringify(section?.config ?? {}, null, 2)
  );
  const [sortOrder, setSortOrder] = useState(String(section?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(section?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!key) return;
    setError(null);
    let config: unknown;
    try {
      config = JSON.parse(configText);
    } catch {
      setError("Config must be valid JSON");
      return;
    }
    setIsSubmitting(true);
    try {
      await upsertHomepageSectionAction(locale, {
        key,
        titleEn,
        titleFr,
        titleAr,
        config,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      toast.success(t("saved"));
      if (!section) {
        setKey("");
        setTitleEn("");
        setTitleFr("");
        setTitleAr("");
        setConfigText("{}");
        setSortOrder("0");
        setIsActive(true);
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Key (e.g. featured_hotels)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={!!section}
        />
        <Input placeholder="Title (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <Input placeholder="Title (FR)" value={titleFr} onChange={(e) => setTitleFr(e.target.value)} />
        <Input placeholder="Title (AR)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
      </div>
      <Textarea
        className="font-mono text-xs"
        rows={5}
        value={configText}
        onChange={(e) => setConfigText(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort order</span>
          <Input
            type="number"
            className="w-20"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
          />
          Active
        </label>
      </div>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Save
      </Button>
    </div>
  );
}

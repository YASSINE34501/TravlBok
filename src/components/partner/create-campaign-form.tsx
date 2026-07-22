"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCampaignAction } from "@/domains/affiliates/actions";
import { useRouter } from "@/i18n/navigation";

export function CreateCampaignForm({
  locale,
  organizationId,
}: {
  locale: string;
  organizationId: string;
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name || !slug) return;
    setIsSubmitting(true);
    try {
      const result = await createCampaignAction(locale, organizationId, { name, slug });
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      toast.success(tCommon("success"));
      setName("");
      setSlug("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Input
        placeholder={t("campaignName")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder={t("campaignSlug")}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        {t("createCampaign")}
      </Button>
    </div>
  );
}

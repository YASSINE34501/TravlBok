"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCmsPageAction } from "@/domains/admin/actions";

export function CmsContentEditor({
  locale,
  slug,
  content,
}: {
  locale: string;
  slug: string;
  content: Record<string, unknown>;
}) {
  const [text, setText] = useState(JSON.stringify(content, null, 2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCmsPageAction(locale, slug, parsed);
      toast.success("Saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={20}
        className="font-mono text-xs"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button disabled={isSubmitting} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}

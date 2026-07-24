"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiKeyAction } from "@/domains/api-keys/actions";
import { useRouter } from "@/i18n/navigation";

export function ApiKeyForm({ locale, organizationId }: { locale: string; organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await createApiKeyAction(locale, organizationId, name);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRawKey(result.rawKey);
      setName("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (rawKey) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">Copy this key now — it won&apos;t be shown again.</p>
        <code className="block break-all rounded bg-muted p-2 text-sm">{rawKey}</code>
        <Button size="sm" onClick={() => setRawKey(null)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Key name (e.g. Booking sync integration)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button disabled={isSubmitting || !name.trim()} onClick={handleCreate}>
        Generate key
      </Button>
    </div>
  );
}

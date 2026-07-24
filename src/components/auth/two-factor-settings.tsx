"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateTwoFactorSetupAction,
  enableTwoFactorAction,
  disableTwoFactorAction,
  regenerateBackupCodesAction,
} from "@/domains/security/actions";
import { useRouter } from "@/i18n/navigation";

export function TwoFactorSettings({
  locale,
  initiallyEnabled,
}: {
  locale: string;
  initiallyEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [step, setStep] = useState<"idle" | "setup" | "backup-codes">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startSetup() {
    setIsSubmitting(true);
    try {
      const result = await generateTwoFactorSetupAction(locale);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setQrDataUrl(result.data.qrDataUrl);
      setSecret(result.data.secret);
      setStep("setup");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmSetup() {
    setIsSubmitting(true);
    try {
      const result = await enableTwoFactorAction(locale, code);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.data.backupCodes);
      setStep("backup-codes");
      setEnabled(true);
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function disable() {
    setIsSubmitting(true);
    try {
      const result = await disableTwoFactorAction(locale, password);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Two-factor authentication disabled");
      setEnabled(false);
      setPassword("");
      setStep("idle");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function regenerateCodes() {
    setIsSubmitting(true);
    try {
      const result = await regenerateBackupCodesAction(locale);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.data.backupCodes);
      setStep("backup-codes");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "backup-codes") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Save your backup codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Each code can be used once if you lose access to your authenticator app. Store them
            somewhere safe — they won&apos;t be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-3 font-mono text-sm">
            {backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Button size="sm" onClick={() => setStep("idle")}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan this QR code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Two-factor authentication QR code" className="size-48" />
          <p className="text-xs text-muted-foreground">
            Or enter this code manually: <span className="font-mono">{secret}</span>
          </p>
          <Input
            inputMode="numeric"
            placeholder="Enter the 6-digit code from your app"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={isSubmitting || code.length !== 6} onClick={confirmSetup}>
              Confirm & enable
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStep("idle")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {enabled
            ? "Two-factor authentication is enabled on your account."
            : "Add an authenticator-app code as a second step at login."}
        </p>
        {enabled ? (
          <div className="space-y-3">
            <Button size="sm" variant="outline" disabled={isSubmitting} onClick={regenerateCodes}>
              Regenerate backup codes
            </Button>
            <div className="flex items-end gap-2">
              <Input
                type="password"
                placeholder="Current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={isSubmitting || !password}
                onClick={disable}
              >
                Disable
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" disabled={isSubmitting} onClick={startSetup}>
            Enable two-factor authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

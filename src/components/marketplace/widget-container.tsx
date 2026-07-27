"use client";

import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useExternalScript } from "@/components/marketplace/use-external-script";

/**
 * Shell for EXTERNAL_WIDGET-sourced offers (provider content embedded inline
 * via a third-party script). Dormant in production today — no real widget
 * provider is contracted yet, so callers pass `isConfigured={false}` and this
 * always renders the `unavailable` state, same "opt-in, never fake" pattern
 * as the mock distribution provider. Once a real provider + `scriptSrc` is
 * configured, this handles the loading/ready/error states around it.
 */
export function WidgetContainer({
  isConfigured,
  scriptSrc,
  unavailableLabel,
  errorLabel,
  loadingLabel,
  className,
  children,
}: {
  isConfigured: boolean;
  /** Provider's widget loader script URL. Only fetched when `isConfigured` is true. */
  scriptSrc?: string;
  unavailableLabel: string;
  errorLabel: string;
  loadingLabel: string;
  className?: string;
  /** The provider's mount target (e.g. a `<div id="...">`), rendered once the script is ready. */
  children?: React.ReactNode;
}) {
  const status = useExternalScript(isConfigured ? scriptSrc : undefined);

  if (!isConfigured) {
    return <EmptyState title={unavailableLabel} className={className} />;
  }
  if (status === "error") {
    return <EmptyState title={errorLabel} className={className} />;
  }
  if (status !== "ready") {
    return (
      <div className={`flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground ${className ?? ""}`}>
        <Loader2 className="size-4 animate-spin" />
        {loadingLabel}
      </div>
    );
  }
  if (!children) {
    return <EmptyState title={errorLabel} className={className} />;
  }
  return <>{children}</>;
}

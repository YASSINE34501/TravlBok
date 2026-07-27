import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Purely presentational — the underlying flow is still one page/one
 * round-trip (preview → confirm), not a real multi-step wizard. This just
 * gives travelers a visual sense of progress, matching the reference's
 * stepped checkout feel without changing any booking business logic.
 */
export function BookingSteps({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ol className="mb-6 flex items-center gap-2 sm:gap-4">
      {steps.map((label, index) => {
        const step = index + 1;
        const isComplete = step < currentStep;
        const isActive = step === currentStep;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isComplete && "border-primary bg-primary text-primary-foreground",
                isActive && !isComplete && "border-primary text-primary",
                !isActive && !isComplete && "border-border text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="size-3.5" /> : step}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:block",
                isActive || isComplete ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {step < steps.length && (
              <span className={cn("h-px flex-1", isComplete ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
} as const;

/**
 * Read-only 1-N star display (hotel star class, review scores). Filled
 * stars are gold, empty ones light gray, with a brighter gold on hover —
 * plain SVG icons and CSS transitions, no unicode glyphs.
 */
export function StarRating({ rating, maxStars = 5, size = "md", className }: Props) {
  const filledCount = Math.round(rating);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${filledCount} out of ${maxStars} stars`}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < filledCount;
        return (
          <Star
            key={i}
            className={cn(
              SIZE_CLASSES[size],
              "shrink-0 transition-colors duration-150 hover:fill-primary hover:text-primary",
              filled ? "fill-primary text-primary" : "fill-muted text-muted"
            )}
          />
        );
      })}
    </div>
  );
}

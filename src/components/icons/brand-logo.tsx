import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

const ASPECT_WIDTH = 1536;
const ASPECT_HEIGHT = 1024;

/**
 * Official TravlBok logo (icon + wordmark lockup). The source file has a
 * lot of transparent padding above/below the actual artwork, so it needs
 * a taller display height than a typical compact navbar logo to stay
 * legible — that's inherent to the asset, not a rendering bug.
 */
export function BrandLogo({ className }: Props) {
  return (
    <Image
      src="/brand/logo.png"
      alt="TravlBok"
      width={ASPECT_WIDTH}
      height={ASPECT_HEIGHT}
      className={cn("object-contain", className)}
      priority
    />
  );
}

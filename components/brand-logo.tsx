import Image from "next/image";
import { brand } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

/** Brand mark from /public/event-pilot-logo.png */
export function BrandLogo({ priority = false, className, imageClassName }: BrandLogoProps) {
  return (
    <Image
      src={brand.logo}
      alt={`${brand.name} logo`}
      width={62}
      height={75}
      priority={priority}
      unoptimized
      className={cn("shrink-0 object-contain", className, imageClassName)}
    />
  );
}

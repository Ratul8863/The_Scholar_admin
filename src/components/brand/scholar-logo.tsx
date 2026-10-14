import Image from "next/image";
import { cn } from "@/lib/utils";

export function ScholarLogo({
  variant = "lockup",
  alt = "The Scholar",
  className,
}: {
  variant?: "lockup" | "mark";
  alt?: string;
  className?: string;
}) {
  if (variant === "mark") {
    return <Image src="/brand/scholar-mark.png" alt={alt} width={309} height={166} className={cn("h-8 w-auto", className)} />;
  }
  return <Image src="/brand/scholar-logo.png" alt={alt} width={511} height={250} priority className={cn("h-auto w-full", className)} />;
}

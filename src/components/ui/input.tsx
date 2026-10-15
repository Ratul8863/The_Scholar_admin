"use client";

import { cn } from "@/lib/utils";
import { controlClass } from "@/components/ui/styles";
import { DateField, Select } from "@/components/ui/choice";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (type === "date") return <DateField className={className} {...props} />;
  return <input type={type} className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "audit-area h-auto min-h-28", className)}
      {...props}
    />
  );
}

export { Select };

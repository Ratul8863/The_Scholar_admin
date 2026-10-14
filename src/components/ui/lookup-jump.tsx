"use client";

import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/choice";

const paths = {
  university: "/universities/",
  professor: "/professors/records/",
  country: "/universities/countries/",
} as const;

export function LookupJump({
  kind,
  placeholder,
}: {
  kind: keyof typeof paths;
  placeholder: string;
}) {
  const router = useRouter();
  return (
    <Combobox
      aria-label={placeholder}
      lookup={kind}
      placeholder={placeholder}
      value=""
      onChange={(event) => {
        if (event.target.value) router.push(`${paths[kind]}${event.target.value}`);
      }}
    />
  );
}

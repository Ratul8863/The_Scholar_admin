"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/choice";
import { Input, Select } from "@/components/ui/input";

export function SearchBox({ placeholder = "Search records" }: { placeholder?: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (value === initial) return;
      const next = new URLSearchParams(params);
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [value, initial, params, pathname, router]);

  return <Input aria-label="Search" placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} />;
}

export function FilterSelect({ name, label, options, value }: { name: string; label: string; options: { value: string; label: string }[]; value?: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  function apply(nextValue: string) {
    const next = new URLSearchParams(params);
    if (nextValue) next.set(name, nextValue);
    else next.delete(name);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }
  const controlId = `${name}-filter`;
  if (name === "country" || options.length > 12) {
    return (
      <div className="grid min-w-0 gap-1 text-xs font-medium text-muted">
        <label htmlFor={controlId}>{label}</label>
        <Combobox
          id={controlId}
          aria-label={label}
          lookup={name === "country" ? "country" : name === "university" ? "university" : name === "professor" ? "professor" : undefined}
          options={options}
          value={value ?? ""}
          emptyLabel="Any"
          placeholder={`Search ${label.toLowerCase()}`}
          onChange={(event) => apply(event.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="grid min-w-0 gap-1 text-xs font-medium text-muted">
      <label htmlFor={controlId}>{label}</label>
      <Select
        id={controlId}
        aria-label={label}
        value={value ?? ""}
        options={[{ value: "", label: "Any" }, ...options]}
        onChange={(event) => apply(event.target.value)}
      />
    </div>
  );
}

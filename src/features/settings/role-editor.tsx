"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRolePermissionsAction } from "@/server/actions/mutations";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export function RoleEditor({ roles, permissions }: { roles: { id: string; name: string; permissions: string[] }[]; permissions: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(roles[0]?.id ?? "");
  const role = roles.find((item) => item.id === selected);
  const [granted, setGranted] = useState<string[]>(role?.permissions ?? []);
  return (
    <div className="grid gap-3">
      <Select aria-label="Role" value={selected} options={roles.map((item) => ({ value: item.id, label: item.name }))} onChange={(event) => { setSelected(event.target.value); setGranted(roles.find((item) => item.id === event.target.value)?.permissions ?? []); }} />
      <div className="grid gap-1 sm:grid-cols-2">
        {permissions.map((permission) => (
          <label key={permission} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm transition-colors duration-[180ms] hover:bg-canvas">
            <input type="checkbox" className="accent-primary" checked={granted.includes(permission)} onChange={(event) => setGranted((current) => event.target.checked ? [...current, permission] : current.filter((item) => item !== permission))} />
            {permission}
          </label>
        ))}
      </div>
      <Button type="button" onClick={async () => { await saveRolePermissionsAction(selected, granted); router.refresh(); }}>Save permissions</Button>
    </div>
  );
}

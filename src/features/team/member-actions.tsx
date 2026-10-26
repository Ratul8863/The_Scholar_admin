"use client";

import { changeRoleAction } from "@/server/actions/mutations";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeamMemberActions({
  id,
  active,
  memberRoleKey,
  actorRoleKey,
  roles,
  setActive,
}: {
  id: string;
  active: boolean;
  memberRoleKey: string;
  actorRoleKey: string;
  roles: { id: string; name: string; key?: string }[];
  setActive: (id: string, active: boolean) => Promise<unknown>;
}) {
  const router = useRouter();
  const locked = memberRoleKey === "super_admin";
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  if (locked && actorRoleKey !== "super_admin") return null;
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {locked ? null : (
        <>
          <div className="min-w-0 flex-1 basis-40">
            <Select aria-label="Role" value={roleId} options={roles.map((role) => ({ value: role.id, label: role.name }))} onChange={(event) => setRoleId(event.target.value)} />
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={async () => { await changeRoleAction(id, roleId); router.refresh(); }}>Change role</Button>
        </>
      )}
      <Button type="button" size="sm" variant={active ? "destructive" : "secondary"} onClick={async () => { await setActive(id, !active); router.refresh(); }}>{active ? "Deactivate" : "Reactivate"}</Button>
    </div>
  );
}

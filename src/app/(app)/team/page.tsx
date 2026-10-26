import { teamOverview } from "@/server/services/team";
import { getVerifiedUser } from "@/server/auth/current-user";
import { inviteAction, setActiveAction } from "@/server/actions/mutations";
import { isSuperAdmin } from "@/server/permissions/catalog";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { TeamMemberActions } from "@/features/team/member-actions";
import { InviteAdminForm } from "@/features/team/invite-admin-form";

export default async function TeamPage() {
  const data = await teamOverview();
  const user = await getVerifiedUser();
  const superUser = isSuperAdmin(user.roleKey);
  const inviteRoles = data.roles.filter((role) => {
    const key = String(role.key ?? "");
    return key !== "super_admin" && key !== "admin";
  });
  const assignRoles = superUser
    ? data.roles.filter((role) => String(role.key ?? "") !== "super_admin")
    : inviteRoles;
  return (
    <div className="space-y-4">
      <PageHeader title="Team" description="Super Admin creates admin accounts by email. Other members join from an invitation link." />
      {superUser ? (
        <SectionCard title="Create admin">
          <p className="mb-3 text-sm text-muted">The person receives an invitation, sets their own password, then logs in as Admin.</p>
          <InviteAdminForm />
        </SectionCard>
      ) : null}
      <SectionCard title="Invite">
        <form action={inviteAction} className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Input name="name" placeholder="Name" />
          <Input name="email" type="email" placeholder="Email" required />
          <Select name="roleId" aria-label="Role" required options={inviteRoles.map((role) => ({ value: String(role.id), label: String(role.name) }))} />
          <Button type="submit">Send invitation</Button>
        </form>
      </SectionCard>
      <SectionCard title="Members">
        <ul className="space-y-3 text-sm">
          {data.members.map((member) => (
            <li key={String(member.id)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium [overflow-wrap:anywhere]">{String(member.name)}</p>
                <p className="text-muted [overflow-wrap:anywhere]">{String(member.email)} · {String(member.roleName)} · {String(member.assignments)} assignments</p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
                <TeamMemberActions
                  id={String(member.id)}
                  active={Boolean(member.active)}
                  memberRoleKey={String(member.roleKey ?? "")}
                  actorRoleKey={user.roleKey}
                  roles={assignRoles.map((role) => ({ id: String(role.id), name: String(role.name), key: String(role.key ?? "") }))}
                  setActive={setActiveAction}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Invitations">
        <ul className="space-y-2 text-sm">
          {data.invitations.length === 0 ? <li className="text-muted">No invitations yet.</li> : data.invitations.map((invite) => (
            <li key={String(invite.id)} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 [overflow-wrap:anywhere]">{String(invite.email)}{invite.roleName ? ` · ${String(invite.roleName)}` : ""}</span>
              <Badge tone={statusTone(String(invite.state))}>{String(invite.state)}</Badge>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

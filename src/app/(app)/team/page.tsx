import { teamOverview } from "@/server/services/team";
import { inviteAction, setActiveAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { TeamMemberActions } from "@/features/team/member-actions";

export default async function TeamPage() {
  const data = await teamOverview();
  return (
    <div className="space-y-4">
      <PageHeader title="Team" description="Invite colleagues. Accounts stay inactive until the invitation is accepted." />
      <SectionCard title="Invite">
        <form action={inviteAction} className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Input name="name" placeholder="Name" />
          <Input name="email" type="email" placeholder="Email" required />
          <Select name="roleId" aria-label="Role" required options={data.roles.map((role) => ({ value: String(role.id), label: String(role.name) }))} />
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
                <TeamMemberActions id={String(member.id)} active={Boolean(member.active)} roles={data.roles.map((role) => ({ id: String(role.id), name: String(role.name) }))} setActive={setActiveAction} />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Invitations">
        <ul className="space-y-2 text-sm">{data.invitations.length === 0 ? <li className="text-muted">No invitations yet.</li> : data.invitations.map((invite) => <li key={String(invite.id)} className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 [overflow-wrap:anywhere]">{String(invite.email)}</span><Badge tone={statusTone(String(invite.state))}>{String(invite.state)}</Badge></li>)}</ul>
      </SectionCard>
    </div>
  );
}

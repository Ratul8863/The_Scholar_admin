import { productivity } from "@/server/services/daily";
import { getCurrentUser } from "@/server/auth/current-user";
import { dailyEntryAction } from "@/server/actions/mutations";
import { PageHeader, SectionCard } from "@/components/layout/page";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function DailyWorkPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentUser();
  const month = (await searchParams).month || new Date().toISOString().slice(0, 7);
  const data = await productivity(user.id, month);
  return (
    <div className="space-y-4">
      <PageHeader title="Daily work" description="Operational notes and completed work. This is not employee surveillance." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <SectionCard title="Add entry">
          <form action={dailyEntryAction} className="grid gap-2">
            <Select name="entryType" aria-label="Entry type" options={[{ value: "work", label: "Completed work" }, { value: "note", label: "Daily note" }]} />
            <Input name="workDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            <Input name="title" placeholder="What was done" required />
            <Input name="category" placeholder="Category" defaultValue="research" />
            <Input name="durationMinutes" type="number" min={0} placeholder="Minutes (optional)" />
            <Textarea name="notes" placeholder="Notes" />
            <Button type="submit">Save entry</Button>
          </form>
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title={`Month ${data.month}`}>
            <p className="text-sm">{data.entries.length} entries · <span className="num">{data.minutes}</span> minutes recorded</p>
          </SectionCard>
          <SectionCard title="Weekly summary">
            <ul className="space-y-1 text-sm">{data.weeks.length === 0 ? <li className="text-muted">No entries this month.</li> : data.weeks.map((week) => <li key={week.week} className="flex flex-wrap justify-between gap-2"><span>Week of {week.week}</span><span className="num">{week.entries} entries · {week.minutes} min</span></li>)}</ul>
          </SectionCard>
          <SectionCard title="Entries">
            <ul className="space-y-2 text-sm">{data.entries.map((entry) => <li key={String(entry.id)} className="[overflow-wrap:anywhere]"><span className="text-muted">{String(entry.workDate)} · {String(entry.entryType)} · </span>{String(entry.title)}</li>)}</ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

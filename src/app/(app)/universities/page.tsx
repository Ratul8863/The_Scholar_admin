import Link from "next/link";
import { countryCards } from "@/server/services/universities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { NavigationCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LookupJump } from "@/components/ui/lookup-jump";

export default async function UniversitiesPage() {
  const [user, cards] = await Promise.all([getCurrentUser(), countryCards()]);
  return (
    <div>
      <PageHeader title="Universities" description="Main university records are separate from professor-research universities." action={can(user, "university.create") ? <Button asChild><Link href="/universities/new" prefetch={false}>Add university</Link></Button> : null} />
      {can(user, "university.read") ? <div className="mb-4 max-w-md"><LookupJump kind="university" placeholder="Find a university" /></div> : null}
      {cards.length === 0 ? <EmptyState title="No countries yet" body="Add a country in Settings, then create universities under it." action={<Button asChild variant="outline"><Link href="/settings" prefetch={false}>Open settings</Link></Button>} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <NavigationCard key={card.id} href={`/universities/countries/${card.id}`} eyebrow={card.code} title={card.name} meta={`${card.count} universities`} />
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { countryCards } from "@/server/services/universities";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { NavigationCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LookupJump } from "@/components/ui/lookup-jump";
import { CountryCatalogActions, CountryCatalogNote } from "@/components/records/country-catalog-note";

export default async function UniversitiesPage() {
  const [user, cards] = await Promise.all([getCurrentUser(), countryCards()]);
  const canManageCountries = can(user, "settings.manage");
  return (
    <div>
      <PageHeader
        title="Universities"
        description="Main university records are separate from professor-research universities. Countries come from the shared Settings catalog."
        action={
          <div className="flex flex-wrap gap-2">
            <CountryCatalogActions canManage={canManageCountries} />
            {can(user, "university.create") ? (
              <Button asChild>
                <Link href="/universities/new" prefetch={false}>Add university</Link>
              </Button>
            ) : null}
          </div>
        }
      />
      {can(user, "university.read") ? (
        <div className="mb-4 max-w-md">
          <LookupJump kind="university" placeholder="Find a university" />
        </div>
      ) : null}
      {cards.length === 0 ? (
        <EmptyState
          title="No countries yet"
          body="Add a country in Settings first. Then create universities under that country."
          action={canManageCountries ? <Button asChild variant="outline"><Link href="/settings#countries" prefetch={false}>Open settings</Link></Button> : null}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <NavigationCard key={card.id} href={`/universities/countries/${card.id}`} eyebrow={card.code} title={card.name} meta={`${card.count} universities`} />
          ))}
        </div>
      )}
      {cards.length > 0 ? <CountryCatalogNote canManage={canManageCountries} /> : null}
    </div>
  );
}

import Link from "next/link";
import { professorCountryCards } from "@/server/services/professors";
import { listCountries } from "@/server/services/settings";
import { can, getCurrentUser } from "@/server/auth/current-user";
import { PageHeader, EmptyState } from "@/components/layout/page";
import { NavigationCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LookupJump } from "@/components/ui/lookup-jump";

export default async function ProfessorsPage() {
  const [user, cards, countries] = await Promise.all([getCurrentUser(), professorCountryCards(), listCountries()]);
  return (
    <div>
      <PageHeader title="Professor research" description="This hierarchy never creates or edits a main university record." action={<Button asChild variant="outline"><Link href="/professors/table">Open professor table</Link></Button>} />
      {can(user, "professor.read") ? <div className="mb-4 max-w-md"><LookupJump kind="professor" placeholder="Find a professor" /></div> : null}
      {countries.length === 0 ? <EmptyState title="Add a country first" body="Professor universities are organized by the shared country list." /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.filter((country) => country.active !== false).map((country) => {
          const card = cards.find((item) => item.id === String(country.id));
          return (
            <NavigationCard key={String(country.id)} href={`/professors/countries/${country.id}`} title={String(country.name)} meta={`${card?.count ?? 0} professor universities`} />
          );
        })}
      </div>
    </div>
  );
}

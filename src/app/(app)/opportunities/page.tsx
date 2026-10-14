import { PageHeader } from "@/components/layout/page";
import { NavigationCard } from "@/components/ui/card";

const sections = [
  ["leadership", "Leadership", "Organized leadership opportunities with their own deadlines and verification."],
  ["fellowship", "Fellowship", "Fellowship funding, duration, stipend, and travel details."],
  ["internship", "Internship", "Internship requirements, eligibility, and application links."],
  ["emergency", "Emergency Upload / Recent News Update", "Urgent announcements that surface first in the content workspace."],
];

export default function OpportunitiesPage() {
  return (
    <div>
      <PageHeader title="Co-curricular" description="Four sections only: leadership, fellowship, internship, and emergency upload." />
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map(([href, title, body]) => (
          <NavigationCard key={href} href={href === "emergency" ? "/emergency" : `/opportunities/${href}`} title={title} description={body} />
        ))}
      </div>
    </div>
  );
}

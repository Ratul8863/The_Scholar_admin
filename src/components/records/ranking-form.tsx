import { saveRankingAction } from "@/server/actions/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RankingForm({ universityId }: { universityId: string }) {
  return (
    <form
      action={async (formData) => {
        "use server";
        await saveRankingAction({
          universityId,
          organization: formData.get("organization"),
          year: formData.get("year"),
          overallRank: formData.get("overallRank"),
          sourceUrl: formData.get("sourceUrl"),
        });
      }}
      className="grid gap-2 sm:grid-cols-2"
    >
      <Input name="organization" placeholder="Ranking organization" required />
      <Input name="year" placeholder="Year" />
      <Input name="overallRank" placeholder="Overall rank" />
      <Input name="sourceUrl" type="url" placeholder="Source URL" required />
      <Button type="submit" size="sm">Add sourced ranking</Button>
    </form>
  );
}

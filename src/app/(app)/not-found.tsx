import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ui/card";

export default function NotFound() {
  return (
    <ContentCard title="Record not found">
      <p className="text-sm text-muted">It may have been archived or the link is out of date.</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/dashboard">Back to dashboard</Link></Button>
    </ContentCard>
  );
}

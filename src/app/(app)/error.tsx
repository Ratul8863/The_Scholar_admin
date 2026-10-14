"use client";

import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ui/card";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ContentCard title="This page could not be loaded">
      <p className="text-sm text-muted">The workspace hit a problem. Retry the page. If it continues, check the database connection.</p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </ContentCard>
  );
}

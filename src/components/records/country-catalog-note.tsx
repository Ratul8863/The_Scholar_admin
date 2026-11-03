import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Countries are one shared catalog (Settings). Modules only browse and attach records under them. */
export function CountryCatalogActions({ canManage }: { canManage: boolean }) {
  if (!canManage) return null;
  return (
    <Button asChild variant="outline">
      <Link href="/settings#countries" prefetch={false}>Add country</Link>
    </Button>
  );
}

export function CountryCatalogNote({ canManage }: { canManage: boolean }) {
  if (!canManage) {
    return <p className="type-14 mt-4">Countries are managed in Settings. Ask an admin if you need a new one.</p>;
  }
  return (
    <p className="type-14 mt-4">
      Need another country?{" "}
      <Link className="text-primary" href="/settings#countries" prefetch={false}>Add it in Settings</Link>
      . One country list is shared by universities, scholarships, and professor research.
    </p>
  );
}

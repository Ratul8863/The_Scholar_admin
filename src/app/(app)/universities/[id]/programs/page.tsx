import { redirect } from "next/navigation";

export default async function UniversityProgramsIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/universities/${id}`);
}

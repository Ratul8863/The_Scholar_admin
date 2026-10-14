import { redirect } from "next/navigation";

export default async function ProfessorDepartmentsIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/professors/universities/${id}`);
}

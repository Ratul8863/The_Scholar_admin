import { PageHeader } from "@/components/layout/page";
import { EntityCreateForm } from "@/features/forms/entity-create-form";

export default function NewContentPage() {
  return (
    <div>
      <PageHeader title="New content" description="Reference the source record. Do not copy the scholarship or opportunity into this form." />
      <EntityCreateForm kind="content" />
    </div>
  );
}

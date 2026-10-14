import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/server/actions/mutations";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AppShell user={{ name: user.name, roleName: user.roleName, permissions: user.permissions }} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}

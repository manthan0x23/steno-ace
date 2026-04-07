import { api } from "~/trpc/server";
import UserSettingsPage from "./_components/settings-client";

export default async function SettingsPage() {
  const data = await api.user.getMyAccounts();

  const providers = data.accounts.map((a) => a.providerId);

  return <UserSettingsPage providers={providers} user={data.user} />;
}

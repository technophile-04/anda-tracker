import { EggTracker } from "@/app/components/EggTracker";
import { getGroupByInviteCode } from "@/app/actions";

type GroupPageProps = {
  params: Promise<{ code: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { code } = await params;
  const inviteCode = decodeURIComponent(code);
  const result = await getGroupByInviteCode(inviteCode);

  if (!result.configured) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Egg Crate Group
        </h1>
        <p className="text-sm text-slate-600">
          Add your Supabase credentials to start using groups.
        </p>
      </main>
    );
  }

  if (!result.group || !result.eggs) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Group not found
        </h1>
        <p className="text-sm text-slate-600">
          The invite code is invalid or the group no longer exists.
        </p>
      </main>
    );
  }

  return (
    <EggTracker
      initialEggs={result.eggs}
      configured={result.configured}
      group={result.group}
    />
  );
}

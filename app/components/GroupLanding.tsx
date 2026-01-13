"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup, joinGroup } from "../actions";

type GroupLandingProps = {
  configured: boolean;
};

export function GroupLanding({ configured }: GroupLandingProps) {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!configured) {
      setError("Add Supabase credentials to create groups.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await createGroup(creatorName);
      if (result.error || !result.group) {
        setError(result.error || "Unable to create group");
        return;
      }
      router.push(`/g/${result.group.invite_code}`);
    });
  };

  const handleJoin = () => {
    if (!configured) {
      setError("Add Supabase credentials to join groups.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await joinGroup(inviteCode, joinName);
      if (result.error || !result.group) {
        setError(result.error || "Unable to join group");
        return;
      }
      router.push(`/g/${result.group.invite_code}`);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="confetti-banner flex flex-col gap-4 p-8 text-slate-900">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wide text-rose-700/80">
          <span>Two-person crate</span>
          <span className="candy-pill px-3 py-1 text-xs">🥚 Cute cheeky egg</span>
        </div>
        <h1 className="text-4xl font-semibold">Egg Crate Groups</h1>
        <p className="text-sm text-slate-700">
          Create a private group, invite a buddy, and track eggs together — with a little extra sparkle.
        </p>
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-800">
          <span className="candy-pill px-3 py-1">✨ Sticker fun</span>
          <span className="candy-pill px-3 py-1">🐣 Cheer mode</span>
          <span className="candy-pill px-3 py-1">🎉 Party crate</span>
        </div>
      </header>

      {!configured ? (
        <div className="candy-panel p-3 text-sm text-amber-900">
          Add `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local` to
          enable groups.
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="candy-card pop-on-hover flex flex-col gap-3 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Create a group
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You will get a shareable invite link for one friend.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Your name</label>
            <input
              className="candy-input w-full px-3 py-2 text-sm"
              placeholder="e.g. Shiv"
              value={creatorName}
              onChange={(event) => setCreatorName(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="candy-button mt-3 w-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create group"}
          </button>
          <p className="text-xs text-slate-500">🥚 Your crate, your rules.</p>
        </div>

        <div className="candy-card pop-on-hover flex flex-col gap-3 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Join a group</h2>
            <p className="mt-1 text-sm text-slate-600">
              Paste an invite code and start tracking together.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Invite code</label>
            <input
              className="candy-input w-full px-3 py-2 text-sm uppercase tracking-widest"
              placeholder="e.g. A1B2C3"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Your name</label>
            <input
              className="candy-input w-full px-3 py-2 text-sm"
              placeholder="e.g. Maya"
              value={joinName}
              onChange={(event) => setJoinName(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={isPending}
            className="candy-button-outline mt-3 w-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Joining..." : "Join group"}
          </button>
          <p className="text-xs text-slate-500">🐣 Bring your egg energy.</p>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </main>
  );
}

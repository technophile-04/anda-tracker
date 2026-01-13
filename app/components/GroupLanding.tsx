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
      <header className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Two-person crate
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Egg Crate Groups
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a private group, invite one friend, and track eggs together.
        </p>
      </header>

      {!configured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Add `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local` to
          enable groups.
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Create a group
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You will get a shareable invite link for one friend.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Your name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="e.g. Shiv"
              value={creatorName}
              onChange={(event) => setCreatorName(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create group"}
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Join a group</h2>
          <p className="mt-2 text-sm text-slate-500">
            Paste an invite code and start tracking together.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Invite code</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase tracking-widest focus:border-slate-400 focus:outline-none"
              placeholder="e.g. A1B2C3"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Your name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="e.g. Maya"
              value={joinName}
              onChange={(event) => setJoinName(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={isPending}
            className="mt-4 w-full rounded-lg border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            {isPending ? "Joining..." : "Join group"}
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { markEggAsEaten, refreshEggs } from "../actions";

const GRID_SIZE = 30;
const COLOR_CLASSES = [
  "bg-amber-200",
  "bg-emerald-200",
  "bg-sky-200",
  "bg-violet-200",
  "bg-rose-200",
  "bg-lime-200",
  "bg-teal-200",
  "bg-orange-200",
];

export type Egg = {
  id: string;
  crate_id?: string;
  position: number;
  eaten_by: string | null;
  eaten_at: string | null;
};

export type Group = {
  id: string;
  invite_code: string;
  member_one_name: string;
  member_two_name: string | null;
};

const colorForName = (name: string | null) => {
  if (!name) return "bg-white";
  const hash = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLOR_CLASSES[hash % COLOR_CLASSES.length];
};

const initialForName = (name: string | null) => {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed[0]?.toUpperCase() ?? "";
};

type EggTrackerProps = {
  initialEggs: Egg[];
  configured: boolean;
  group: Group;
};

export function EggTracker({ initialEggs, configured, group }: EggTrackerProps) {
  const [eggs, setEggs] = useState<Egg[]>(initialEggs);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteUrl(`${window.location.origin}/g/${group.invite_code}`);
    }
  }, [group.invite_code]);

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy invite link.");
    }
  };

  const handleRefresh = () => {
    startTransition(async () => {
      setError("");
      const result = await refreshEggs(group.id);
      if (result.error) {
        setError(result.error);
      } else if (result.eggs) {
        setEggs(result.eggs);
      }
    });
  };

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let eatenCount = 0;

    eggs.forEach((egg) => {
      if (egg.eaten_by) {
        counts[egg.eaten_by] = (counts[egg.eaten_by] || 0) + 1;
        eatenCount += 1;
      }
    });

    return {
      counts,
      eatenCount,
      remaining: GRID_SIZE - eatenCount,
    };
  }, [eggs]);

  const members = useMemo(
    () =>
      [group.member_one_name, group.member_two_name].filter(
        (member): member is string => Boolean(member)
      ),
    [group.member_one_name, group.member_two_name]
  );

  const sortedEaten = useMemo(() => {
    return eggs
      .filter((egg) => egg.eaten_by)
      .sort((a, b) => a.position - b.position);
  }, [eggs]);

  const handleMark = async (egg: Egg) => {
    if (!configured) {
      setError("Add Supabase credentials to enable updates.");
      return;
    }

    if (!name.trim()) {
      setError("Enter your name before marking an egg.");
      return;
    }

    if (egg.eaten_by) return;

    setSavingId(egg.id);
    setError("");

    startTransition(async () => {
      const result = await markEggAsEaten(egg.id, name.trim(), group.id);

      if (result.error) {
        setError(result.error);
      } else if (result.eggs) {
        setEggs(result.eggs);
      }

      setSavingId(null);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="candy-card flex flex-col gap-6 p-6 md:p-8">
        <div className="confetti-banner flex flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wide text-rose-700/80">
            <span>Shared crate</span>
            <span className="candy-pill px-3 py-1 text-xs">🥚 Cute cheeky egg</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Egg Crate Tracker
          </h1>
          <p className="text-sm text-slate-700">
            Track which egg was eaten and by whom. Winky egg says: play fair.
          </p>
        </div>
        {!configured ? (
          <div className="candy-panel p-3 text-sm text-amber-900">
            Add `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local` to
            enable sync.
          </div>
        ) : null}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-md flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Your name
            </label>
            <input
              className="candy-input w-full px-3 py-2 text-sm"
              placeholder="e.g. Shiv"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isPending}
              className="candy-button-outline px-4 py-2 text-sm disabled:opacity-50"
            >
              {isPending ? "Refreshing..." : "Refresh"}
            </button>
            <div className="candy-button px-4 py-2 text-sm">
              {stats.remaining} eggs left 🥚
            </div>
          </div>
        </div>
        <div className="candy-panel p-4 text-sm text-slate-700">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/70">
                Invite link
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Share this link with one friend to join.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                readOnly
                value={inviteUrl || group.invite_code}
                className="candy-input w-full bg-white px-3 py-2 text-sm text-slate-600 md:w-72"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                disabled={!inviteUrl}
                className="candy-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {members.map((member) => (
              <span
                key={member}
                className="candy-pill px-3 py-1 text-xs"
              >
                {member}
              </span>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="candy-card p-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Crate layout (6 x 5)
            </h2>
            <span className="text-sm text-slate-600">
              Tap an egg to mark it eaten
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {eggs.map((egg) => {
              const isEaten = Boolean(egg.eaten_by);
              const isSaving = savingId === egg.id;
              const initial = initialForName(egg.eaten_by);
              return (
                <button
                  key={egg.id}
                  type="button"
                  onClick={() => handleMark(egg)}
                  disabled={isEaten || isSaving || isPending}
                  data-eaten={isEaten ? "true" : "false"}
                  aria-label={
                    isEaten
                      ? `Egg ${egg.position} eaten by ${egg.eaten_by ?? ""}`
                      : `Egg ${egg.position} available`
                  }
                  className={`egg-grid-tile pop-on-hover flex flex-col items-center justify-center gap-2 p-2 text-sm font-semibold transition hover:scale-[1.02] ${
                    isSaving ? "opacity-70" : ""
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-600">
                    #{egg.position}
                  </span>

                  <div
                    className={`relative flex h-[68px] w-full max-w-[96px] items-center justify-center rounded-full border-2 ${
                      isEaten
                        ? "border-transparent"
                        : "border-[rgba(59,29,79,0.22)] bg-white"
                    } ${isEaten ? colorForName(egg.eaten_by) : ""}`}
                  >
                    <span className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-full bg-white/45 blur-[0.5px]" />

                    {isEaten ? (
                      <svg
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
                        aria-hidden="true"
                      >
                        <path
                          d="M18 62 L30 53 L39 61 L48 52 L58 62 L66 55 L74 62 L84 54"
                          fill="none"
                          stroke="rgba(59,29,79,0.75)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M26 72 L35 65 L44 72 L53 65 L62 72 L71 65 L80 72"
                          fill="none"
                          stroke="rgba(59,29,79,0.55)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}

                    {isEaten ? (
                      <span className="relative z-10 text-2xl font-black text-[rgba(59,29,79,0.9)]">
                        {initial}
                      </span>
                    ) : (
                      <span className="relative z-10 text-xl opacity-35">
                        🥚
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="candy-card p-6">
            <h2 className="text-lg font-semibold text-slate-800">Stats</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Eggs eaten</span>
                <span className="font-semibold text-slate-900">
                  {stats.eatenCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Remaining</span>
                <span className="font-semibold text-slate-900">
                  {stats.remaining}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-600">By person</h3>
              {Object.keys(stats.counts).length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No eggs marked yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {Object.entries(stats.counts).map(([person, count]) => (
                    <li
                      key={person}
                      className="flex items-center justify-between rounded-xl border-2 border-slate-100 bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${colorForName(
                            person,
                          )}`}
                        />
                        <span className="font-medium text-slate-700">
                          {person}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="candy-card p-6">
            <h2 className="text-lg font-semibold text-slate-800">Egg list</h2>
            {sortedEaten.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No eggs eaten yet.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {sortedEaten.map((egg) => (
                    <li
                      key={egg.id}
                      className="flex items-start justify-between gap-3 rounded-xl border-2 border-slate-100 bg-white px-3 py-2 shadow-sm"
                    >

                    <div>
                      <p className="font-medium text-slate-700">
                        Egg #{egg.position}
                      </p>
                      <p className="text-xs text-slate-500">
                        Eaten by {egg.eaten_by}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {egg.eaten_at
                        ? new Date(egg.eaten_at).toLocaleString()
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

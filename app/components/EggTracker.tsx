"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { markEggAsEaten, refreshEggs, seedEggs } from "../actions";

const GRID_SIZE = 30;
const COLUMNS = 6;
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

const colorForName = (name: string | null) => {
  if (!name) return "bg-white";
  const hash = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLOR_CLASSES[hash % COLOR_CLASSES.length];
};

type EggTrackerProps = {
  initialEggs: Egg[];
  configured: boolean;
};

export function EggTracker({ initialEggs, configured }: EggTrackerProps) {
  const [eggs, setEggs] = useState<Egg[]>(initialEggs);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRefresh = () => {
    startTransition(async () => {
      setError("");
      const result = await refreshEggs();
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
      const result = await markEggAsEaten(egg.id, name.trim());

      if (result.error) {
        setError(result.error);
      } else if (result.eggs) {
        setEggs(result.eggs);
      }

      setSavingId(null);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Shared crate
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Egg Crate Tracker
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track which egg was eaten and by whom.
          </p>
        </div>
        {!configured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local` to
            enable sync.
          </div>
        ) : null}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-md flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">
              Your name
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
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
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50"
            >
              {isPending ? "Refreshing..." : "Refresh"}
            </button>
            <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              {stats.remaining} eggs left
            </div>
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Crate layout (6 x 5)
            </h2>
            <span className="text-sm text-slate-500">
              Tap an egg to mark it eaten
            </span>
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
          >
            {eggs.map((egg) => {
              const isEaten = Boolean(egg.eaten_by);
              const isSaving = savingId === egg.id;
              return (
                <button
                  key={egg.id}
                  type="button"
                  onClick={() => handleMark(egg)}
                  disabled={isEaten || isSaving || isPending}
                  className={`flex h-16 flex-col items-center justify-center rounded-xl border text-sm font-semibold shadow-sm transition ${
                    isEaten
                      ? `${colorForName(egg.eaten_by)} border-transparent text-slate-800`
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  } ${isSaving ? "opacity-70" : ""}`}
                >
                  <span className="text-xs text-slate-400">#{egg.position}</span>
                  <span className="text-sm">
                    {isEaten ? egg.eaten_by : "Available"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
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
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
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

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Egg list</h2>
            {sortedEaten.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No eggs eaten yet.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {sortedEaten.map((egg) => (
                  <li
                    key={egg.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
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

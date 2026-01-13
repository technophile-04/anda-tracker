"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Egg } from "./components/EggTracker";

const CRATE_ID = "default";
const GRID_SIZE = 30;

export async function refreshEggs(): Promise<{
  eggs?: Egg[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("eggs")
    .select("id, crate_id, position, eaten_by, eaten_at")
    .eq("crate_id", CRATE_ID)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { eggs: data as Egg[] };
}

export async function seedEggs(): Promise<{
  eggs?: Egg[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const supabase = await createClient();

  const seedRows = Array.from({ length: GRID_SIZE }, (_, index) => ({
    crate_id: CRATE_ID,
    position: index + 1,
  }));

  const { error: seedError } = await supabase.from("eggs").insert(seedRows);
  if (seedError) {
    return { error: seedError.message };
  }

  return refreshEggs();
}

export async function markEggAsEaten(
  eggId: string,
  eatenBy: string
): Promise<{
  eggs?: Egg[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("eggs")
    .update({
      eaten_by: eatenBy,
      eaten_at: new Date().toISOString(),
    })
    .eq("id", eggId);

  if (error) {
    return { error: error.message };
  }

  return refreshEggs();
}

export async function getInitialEggs(): Promise<{
  eggs: Egg[];
  configured: boolean;
}> {
  const configured = isSupabaseConfigured();

  if (!configured) {
    // Return empty placeholder eggs when not configured
    const emptyEggs: Egg[] = Array.from({ length: GRID_SIZE }, (_, index) => ({
      id: `placeholder-${index + 1}`,
      position: index + 1,
      eaten_by: null,
      eaten_at: null,
    }));
    return { eggs: emptyEggs, configured: false };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("eggs")
    .select("id, crate_id, position, eaten_by, eaten_at")
    .eq("crate_id", CRATE_ID)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching eggs:", error.message);
    return { eggs: [], configured: true };
  }

  // If no eggs exist, seed them
  if (!data || data.length === 0) {
    const seedResult = await seedEggs();
    if (seedResult.error) {
      console.error("Error seeding eggs:", seedResult.error);
      return { eggs: [], configured: true };
    }
    return { eggs: seedResult.eggs || [], configured: true };
  }

  return { eggs: data as Egg[], configured: true };
}

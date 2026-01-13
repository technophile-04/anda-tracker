"use server";

import { randomBytes } from "crypto";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Egg, Group } from "./components/EggTracker";

const GRID_SIZE = 30;
const INVITE_CODE_BYTES = 3;

const buildPlaceholderEggs = (): Egg[] =>
  Array.from({ length: GRID_SIZE }, (_, index) => ({
    id: `placeholder-${index + 1}`,
    position: index + 1,
    eaten_by: null,
    eaten_at: null,
  }));

const generateInviteCode = () =>
  randomBytes(INVITE_CODE_BYTES).toString("hex").toUpperCase();

const sanitizeInviteCode = (inviteCode: string) =>
  inviteCode.trim().toUpperCase();

async function fetchEggsForGroup(groupId: string): Promise<Egg[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("eggs")
    .select("id, crate_id, position, eaten_by, eaten_at")
    .eq("crate_id", groupId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Egg[];
}

async function seedEggsForGroup(groupId: string): Promise<Egg[]> {
  const supabase = await createClient();

  const seedRows = Array.from({ length: GRID_SIZE }, (_, index) => ({
    crate_id: groupId,
    position: index + 1,
  }));

  const { error: seedError } = await supabase.from("eggs").insert(seedRows);
  if (seedError) {
    throw new Error(seedError.message);
  }

  return fetchEggsForGroup(groupId);
}

export async function refreshEggs(groupId: string): Promise<{
  eggs?: Egg[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  try {
    const eggs = await fetchEggsForGroup(groupId);
    return { eggs };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function markEggAsEaten(
  eggId: string,
  eatenBy: string,
  groupId: string
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

  return refreshEggs(groupId);
}

export async function getGroupByInviteCode(
  inviteCode: string
): Promise<{
  group?: Group;
  eggs?: Egg[];
  error?: string;
  configured: boolean;
}> {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return { configured: false, error: "Supabase is not configured" };
  }

  const supabase = await createClient();
  const normalizedCode = sanitizeInviteCode(inviteCode);

  const { data: group, error } = await supabase
    .from("groups")
    .select("id, invite_code, member_one_name, member_two_name")
    .eq("invite_code", normalizedCode)
    .single();

  if (error || !group) {
    return { configured: true, error: "Group not found" };
  }

  try {
    const eggs = await fetchEggsForGroup(group.id);
    if (eggs.length === 0) {
      const seeded = await seedEggsForGroup(group.id);
      return { configured: true, group: group as Group, eggs: seeded };
    }

    return { configured: true, group: group as Group, eggs };
  } catch (fetchError) {
    return { configured: true, error: (fetchError as Error).message };
  }
}

export async function createGroup(creatorName: string): Promise<{
  group?: Group;
  eggs?: Egg[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const supabase = await createClient();
  const name = creatorName.trim();

  if (!name) {
    return { error: "Enter your name to create a group" };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ invite_code: inviteCode, member_one_name: name })
      .select("id, invite_code, member_one_name, member_two_name")
      .single();

    if (error) {
      if (error.code === "23505") {
        continue;
      }

      return { error: error.message };
    }

    try {
      const eggs = await seedEggsForGroup(group.id);
      return { group: group as Group, eggs };
    } catch (seedError) {
      return { error: (seedError as Error).message };
    }
  }

  return { error: "Unable to create a unique invite code" };
}

export async function joinGroup(
  inviteCode: string,
  memberName: string
): Promise<{
  group?: Group;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const supabase = await createClient();
  const normalizedCode = sanitizeInviteCode(inviteCode);
  const name = memberName.trim();

  if (!normalizedCode) {
    return { error: "Enter an invite code" };
  }

  if (!name) {
    return { error: "Enter your name to join" };
  }

  const { data: group, error } = await supabase
    .from("groups")
    .select("id, invite_code, member_one_name, member_two_name")
    .eq("invite_code", normalizedCode)
    .single();

  if (error || !group) {
    return { error: "Group not found" };
  }

  if (group.member_two_name) {
    return { error: "Group is already full" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("groups")
    .update({ member_two_name: name })
    .eq("id", group.id)
    .select("id, invite_code, member_one_name, member_two_name")
    .single();

  if (updateError || !updated) {
    return { error: updateError?.message || "Unable to join group" };
  }

  return { group: updated as Group };
}

export async function getPlaceholderEggs(): Promise<{
  eggs: Egg[];
  configured: boolean;
}> {
  return { eggs: buildPlaceholderEggs(), configured: false };
}

import { GroupLanding } from "./components/GroupLanding";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function HomePage() {
  const configured = isSupabaseConfigured();

  return <GroupLanding configured={configured} />;
}

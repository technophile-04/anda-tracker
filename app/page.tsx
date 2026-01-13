import { EggTracker } from "./components/EggTracker";
import { getInitialEggs } from "./actions";

export default async function HomePage() {
  const { eggs, configured } = await getInitialEggs();

  return <EggTracker initialEggs={eggs} configured={configured} />;
}

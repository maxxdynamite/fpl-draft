import { getTabLedger } from "@/lib/tab";
import { TabLedger } from "@/components/TabLedger";

export default async function TabPage() {
  const managers = await getTabLedger();

  return <TabLedger managers={managers} />;
}

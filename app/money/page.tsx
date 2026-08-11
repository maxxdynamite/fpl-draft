import { getMoneyLedger } from "@/lib/money";
import { MoneyGrid } from "@/components/MoneyGrid";
import { MoneyLog } from "@/components/MoneyLog";
import { DraftPotSummary } from "@/components/DraftPotSummary";

export default async function MoneyPage() {
  const ledger = await getMoneyLedger();

  return (
    <div className="grid gap-4">
      <MoneyGrid managers={ledger.managers} cells={ledger.cells} />
      <MoneyLog events={ledger.events} />
      <DraftPotSummary managers={ledger.draftPot} />
    </div>
  );
}

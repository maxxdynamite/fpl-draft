import type { MoneyCell, MoneyManager } from "@/lib/money";

function formatAmount(amount: number) {
  return amount % 1 === 0 ? `£${amount}` : `£${amount.toFixed(2)}`;
}

export function MoneyGrid({
  managers,
  cells,
}: {
  managers: MoneyManager[];
  cells: MoneyCell[];
}) {
  const amountByPair = new Map(
    cells.map((c) => [`${c.fromEntryId}-${c.toEntryId}`, c.amount]),
  );

  // Row total = owed TO this manager (sum across the row, matching the
  // "YOU WIN" convention). Column total = owed BY this manager (sum down
  // the column, "YOU OWE") - not part of the source spreadsheet this
  // mirrors, but a natural, low-cost completion of it.
  const rowTotals = new Map<number, number>();
  const colTotals = new Map<number, number>();
  for (const c of cells) {
    rowTotals.set(c.toEntryId, (rowTotals.get(c.toEntryId) ?? 0) + c.amount);
    colTotals.set(c.fromEntryId, (colTotals.get(c.fromEntryId) ?? 0) + c.amount);
  }

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Who owes who
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:text-zinc-600">
          You owe →
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 w-24 min-w-24" />
              {managers.map((m) => (
                <th
                  key={m.entryId}
                  className="w-12 min-w-12 px-1 py-1.5 text-center font-semibold text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.08] truncate"
                >
                  {m.managerName.split(" ")[0]}
                </th>
              ))}
              <th className="w-14 min-w-14 px-2 py-1.5 text-right font-semibold text-zinc-500 dark:text-zinc-400 border-b border-l border-black/[0.06] dark:border-white/[0.08]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {managers.map((row) => (
              <tr key={row.entryId}>
                <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-2 py-1.5 text-left font-semibold text-zinc-700 dark:text-zinc-300 border-r border-black/[0.06] dark:border-white/[0.08] truncate max-w-24">
                  {row.managerName}
                </th>
                {managers.map((col) => {
                  if (col.entryId === row.entryId) {
                    return (
                      <td
                        key={col.entryId}
                        className="bg-black/[0.06] dark:bg-white/[0.05] border-b border-black/[0.04] dark:border-white/[0.06]"
                        aria-hidden="true"
                      />
                    );
                  }
                  const amount = amountByPair.get(`${col.entryId}-${row.entryId}`);
                  return (
                    <td
                      key={col.entryId}
                      className="px-1 py-1.5 text-center tabular-nums border-b border-black/[0.04] dark:border-white/[0.06]"
                    >
                      {amount ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {formatAmount(amount)}
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">–</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400 border-b border-l border-black/[0.04] dark:border-white/[0.06]">
                  {rowTotals.get(row.entryId) ? formatAmount(rowTotals.get(row.entryId)!) : "£0"}
                </td>
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-2 py-1.5 text-left font-semibold text-zinc-400 dark:text-zinc-500 border-r border-t border-black/[0.06] dark:border-white/[0.08]">
                Total
              </th>
              {managers.map((col) => (
                <td
                  key={col.entryId}
                  className="px-1 py-1.5 text-center tabular-nums font-bold text-rose-600 dark:text-rose-400 border-t border-black/[0.06] dark:border-white/[0.08]"
                >
                  {colTotals.get(col.entryId) ? formatAmount(colTotals.get(col.entryId)!) : "£0"}
                </td>
              ))}
              <td className="border-t border-l border-black/[0.06] dark:border-white/[0.08]" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

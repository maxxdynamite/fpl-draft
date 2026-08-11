"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Player, Club } from "@/lib/players";
import type { BlackjackPicks } from "@/lib/blackjackPicks";

const REQUIRED_PICKS = 4;

type ManagerOption = { entryId: number; managerName: string; teamName: string };

// player.status: "a" available, "i" injured, "s" suspended, "u"
// unavailable, "d" doubtful. Blank for "a" - most players are available
// most of the time, and a warning label should only ever appear for the
// exception, not the default case.
const STATUS_LABELS: Record<string, string> = {
  i: "Injured",
  s: "Suspended",
  u: "Unavailable",
  d: "Doubtful",
};

// Squad-sheet order, not alphabetical - GKP/DEF/MID/FWD is how every real
// team sheet groups players, and it's how managers actually scan a club's
// roster when picking.
const POSITION_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 };

// Renders a player's photo, falling back to a generic silhouette on load
// failure (missing headshots are common for fringe/new-signing players on
// the FPL photo CDN) instead of a broken-image icon. headroomOffset
// reproduces the grid tile's deliberate crop (see lib/players.ts) - the
// image renders larger than its circular window and is top-anchored (by
// this offset) so the visible crop clears headroom above the head; the
// fallback icon has no such asymmetry, so it's simply centered regardless.
function PlayerAvatar({
  photoUrl,
  containerClassName,
  imageSize,
  imageClassName,
  fallbackClassName,
  headroomOffset,
}: {
  photoUrl: string;
  containerClassName: string;
  imageSize: number;
  imageClassName: string;
  fallbackClassName: string;
  headroomOffset?: string;
}) {
  const [failed, setFailed] = useState(false);
  const align =
    !failed && headroomOffset ? `items-start justify-center ${headroomOffset}` : "items-center justify-center";
  return (
    <span className={`flex ${align} ${containerClassName}`}>
      {failed ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className={fallbackClassName} aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      ) : (
        <Image
          src={photoUrl}
          alt=""
          width={imageSize}
          height={imageSize}
          onError={() => setFailed(true)}
          className={imageClassName}
        />
      )}
    </span>
  );
}

export function BlackjackPicksForm({
  managers,
  players,
  clubs,
  existingPicks,
}: {
  managers: ManagerOption[];
  players: Player[];
  clubs: Club[];
  existingPicks: BlackjackPicks[];
}) {
  const router = useRouter();
  const [selectedEntryId, setSelectedEntryId] = useState<number | "">("");
  const [selectedClubId, setSelectedClubId] = useState<number>(clubs[0]?.id ?? 0);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const picksByEntry = useMemo(
    () => new Map(existingPicks.map((p) => [p.entryId, p])),
    [existingPicks],
  );

  function handleSelectParticipant(entryId: number) {
    setSelectedEntryId(entryId);
    setStatus("idle");
    setMessage(null);
    const existing = picksByEntry.get(entryId);
    setSelectedPlayerIds(
      existing && existing.playerIds.length === REQUIRED_PICKS ? existing.playerIds : [],
    );
  }

  function togglePlayer(playerId: number) {
    setSelectedPlayerIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= REQUIRED_PICKS) return current;
      return [...current, playerId];
    });
  }

  async function handleSubmit() {
    if (!selectedEntryId || selectedPlayerIds.length !== REQUIRED_PICKS) return;
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/blackjack/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: selectedEntryId, playerIds: selectedPlayerIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      setMessage("Picks saved! Heading back to Blackjack…");
      setTimeout(() => router.push("/blackjack"), 900);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const clubPlayers = players
    .filter((p) => p.club.id === selectedClubId)
    .sort(
      (a, b) =>
        (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99) ||
        a.name.localeCompare(b.name),
    );

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4 sm:p-5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Who&apos;s picking?
        </label>
        <select
          value={selectedEntryId}
          onChange={(e) => handleSelectParticipant(Number(e.target.value))}
          className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm font-semibold bg-black/[0.03] dark:bg-white/[0.06] text-zinc-900 dark:text-white ring-1 ring-black/[0.06] dark:ring-white/[0.1]"
        >
          <option value="" disabled>
            Select your name…
          </option>
          {managers.map((m) => (
            <option key={m.entryId} value={m.entryId}>
              {m.managerName} — {m.teamName}
            </option>
          ))}
        </select>
      </div>

      {selectedEntryId !== "" && (
        <>
          <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Your picks
              </p>
              <p className="text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400">
                {selectedPlayerIds.length} / {REQUIRED_PICKS} selected
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
              {selectedPlayerIds.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Pick {REQUIRED_PICKS} players below.
                </p>
              )}
              {selectedPlayerIds.map((id) => {
                const player = playersById.get(id);
                if (!player) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlayer(id)}
                    className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a]"
                  >
                    <PlayerAvatar
                      photoUrl={player.photoUrl}
                      containerClassName="h-5 w-5 rounded-full overflow-hidden shrink-0"
                      imageSize={20}
                      imageClassName="h-5 w-5 object-cover object-top"
                      fallbackClassName="h-3.5 w-3.5 text-[#04211a]/50"
                    />
                    {player.name}
                    <span aria-hidden="true">×</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {clubs.map((club) => (
              <button
                key={club.id}
                type="button"
                onClick={() => setSelectedClubId(club.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedClubId === club.id
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[var(--shadow-soft)]"
                    : "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {club.shortName}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {clubPlayers.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);
              const isFull = selectedPlayerIds.length >= REQUIRED_PICKS && !isSelected;
              return (
                <button
                  key={player.id}
                  type="button"
                  disabled={isFull}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ring-1 ${
                    isSelected
                      ? "bg-gradient-to-br from-[#00ff85]/15 to-[#04f5ff]/15 ring-[#00b368] dark:ring-[#00ff85]"
                      : isFull
                        ? "bg-black/[0.02] dark:bg-white/[0.03] ring-black/[0.03] dark:ring-white/[0.06] opacity-40 cursor-not-allowed"
                        : "bg-white dark:bg-zinc-900 ring-black/[0.03] dark:ring-white/[0.06] hover:ring-black/[0.1] dark:hover:ring-white/[0.2] shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <PlayerAvatar
                    photoUrl={player.photoUrl}
                    containerClassName="h-12 w-12 rounded-full shrink-0 bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden"
                    imageSize={63}
                    imageClassName="h-[63px] w-[63px] object-cover object-top"
                    fallbackClassName="h-6 w-6 text-zinc-400 dark:text-zinc-500"
                    headroomOffset="pt-1.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold truncate">{player.name}</span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                      {player.position}
                      {STATUS_LABELS[player.status] && (
                        <span className="text-rose-500 dark:text-rose-400">
                          {" "}
                          · {STATUS_LABELS[player.status]}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={selectedPlayerIds.length !== REQUIRED_PICKS || status === "submitting"}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {status === "submitting" ? "Saving…" : "Save picks"}
            </button>
            {message && (
              <p
                className={`text-sm font-semibold ${
                  status === "error"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

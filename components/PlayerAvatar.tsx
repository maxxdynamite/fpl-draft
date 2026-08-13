"use client";

import { useState } from "react";
import Image from "next/image";

// Renders a player's photo, falling back to a generic silhouette on load
// failure (missing headshots are common for fringe/new-signing players on
// the FPL photo CDN) instead of a broken-image icon. headroomOffset
// reproduces the grid tile's deliberate crop (see lib/players.ts) - the
// image renders larger than its circular window and is top-anchored (by
// this offset) so the visible crop clears headroom above the head; the
// fallback icon has no such asymmetry, so it's simply centered regardless.
export function PlayerAvatar({
  photoUrl,
  alt = "",
  containerClassName,
  imageSize,
  imageClassName,
  fallbackClassName,
  headroomOffset,
}: {
  photoUrl: string;
  alt?: string;
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
          alt={alt}
          width={imageSize}
          height={imageSize}
          onError={() => setFailed(true)}
          className={imageClassName}
        />
      )}
    </span>
  );
}

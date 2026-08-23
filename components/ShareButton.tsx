"use client";

import { useState } from "react";

// navigator.share() accepts files and text together - on iOS/Android this
// hands both to the native share sheet as one unit, so picking WhatsApp
// attaches the image with the caption pre-filled as the message, not two
// separate shares. Desktop browsers mostly don't support sharing files at
// all (canShare({ files }) returns false there), hence the fallback
// message pointing back at Copy caption + long-press-to-save instead of
// just silently doing nothing.
export function ShareButton({
  imageUrl,
  caption,
  fileName,
  title,
}: {
  imageUrl: string;
  caption: string;
  fileName: string;
  title: string;
}) {
  const [status, setStatus] = useState<"idle" | "sharing" | "unsupported" | "error">("idle");

  async function handleShare() {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || "image/png" });

      if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
        setStatus("unsupported");
        return;
      }

      setStatus("sharing");
      await navigator.share({ files: [file], text: caption, title });
      setStatus("idle");
    } catch (err) {
      // Cancelling the native share sheet throws AbortError - not a
      // failure, just the user changing their mind.
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      console.error("[ShareButton]", err);
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        disabled={status === "sharing"}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "sharing" ? "Sharing…" : "Share"}
      </button>
      {status === "unsupported" && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
          Sharing images isn&apos;t supported in this browser — try this page on your phone, or use Copy caption and long-press the image instead.
        </p>
      )}
      {status === "error" && (
        <p className="text-[11px] text-red-500 dark:text-red-400 mt-2">
          Couldn&apos;t share that — try again, or use Copy caption instead.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] hover:opacity-90 transition-opacity"
    >
      {copied ? "Copied" : "Copy caption"}
    </button>
  );
}

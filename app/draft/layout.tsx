import { DraftSubNav } from "@/components/DraftSubNav";

export default function DraftLayout({ children }: LayoutProps<"/draft">) {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DraftSubNav />
      {children}
    </main>
  );
}

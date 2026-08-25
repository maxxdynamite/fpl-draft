import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bad Blokes Weekly",
  description: "Draft and Blackjack results for the Bad Blokes league",
};

// Tells the browser itself (not just this app's own CSS) that the page
// is dark - native chrome like scrollbars, form control defaults, and
// autofill styling would otherwise render light-themed even though the
// app's own dark: styles are locked on, since those aren't controlled
// by Tailwind at all.
export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
